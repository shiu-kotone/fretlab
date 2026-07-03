/**
 * Karplus-Strong voice engine, running on the audio render thread.
 *
 * Native DelayNode feedback loops have a fixed minimum round-trip latency of
 * one render quantum (128 samples — a Web Audio spec constant: a cyclic
 * graph can't resolve a dependency within the same block it's produced in).
 * For a multi-second sustain the desired per-loop feedback gain is very
 * close to 1, so any note whose period is shorter than that ~128-sample
 * floor (roughly F#4/370Hz and up, depending on sample rate) has nowhere
 * left to compensate: every note above that threshold collapsed to the same
 * fixed ~sampleRate/128 pitch. An AudioWorkletProcessor manages its own
 * delay buffer directly, sample-by-sample, with no such floor — the fix for
 * accurate pitch across the full fretboard range, not just open strings.
 *
 * Mirrors the DSP design of src/audio/karplusStrong.ts's earlier native-node
 * version: a 2-tap moving-average damping filter *inside* the feedback loop
 * (mathematically bounded to gain <=1 at every frequency, so the loop is
 * unconditionally stable), plus a one-pole lowpass for "brightness" applied
 * only to the *output* tap (never fed back, so it can't destabilize
 * anything), plus a DC-blocking highpass on the summed output.
 */

const MAX_POLYPHONY = 12;
const RELEASE_SECONDS = 0.03;
const TAIL_SECONDS = 0.5;
const DC_BLOCKER_R = 0.995;

class Voice {
  constructor(sampleRateHz, { frequency, feedbackGain, cutoff, velocity, sustainSeconds }) {
    // Fractional delay via a first-order allpass interpolator (Jaffe &
    // Smith's "Extended Karplus-Strong"), not linear interpolation between
    // two buffer taps. Linear interpolation acts as a mild lowpass whose
    // group delay grows with frequency, which measured as an increasing
    // flat-pitch error at higher notes (correct-ish at the low E string,
    // tens of cents flat by the upper fretboard). An allpass has unity gain
    // and much more accurate delay at every frequency, which is exactly why
    // it's the standard fix in the DSP literature for this class of error.
    // Subtract the damping filter's own constant 0.5-sample group delay (a
    // true non-recursive 2-tap FIR average has *exactly* (N-1)/2 = 0.5
    // samples of delay at every frequency) so the *total* loop delay —
    // buffer + allpass + damping filter — comes out to the requested period.
    const period = sampleRateHz / frequency - 0.5;
    let n = Math.floor(period);
    let frac = period - n;
    // Keep frac away from 0: the allpass coefficient approaches 1 there,
    // which is numerically marginal (a delay-domain pole near the unit
    // circle) — nudge into a safer 0.1-1.0 range by borrowing one integer
    // sample instead.
    if (frac < 0.1) {
      frac += 1;
      n -= 1;
    }
    n = Math.max(2, n);
    this.n = n;
    this.allpassC = (1 - frac) / (1 + frac);
    this.allpassPrevIn = 0;
    this.allpassPrevOut = 0;

    this.buffer = new Float32Array(n);
    // Classic Karplus-Strong initialization: fill the whole buffer with an
    // enveloped noise burst (tapered at both ends to avoid a hard click).
    const attackSamples = Math.max(1, Math.floor(n * 0.15));
    const releaseStart = Math.floor(n * 0.7);
    const releaseSamples = Math.max(1, n - releaseStart);
    for (let i = 0; i < n; i++) {
      let env = 1;
      if (i < attackSamples) env = i / attackSamples;
      else if (i >= releaseStart) env = 1 - (i - releaseStart) / releaseSamples;
      this.buffer[i] = (Math.random() * 2 - 1) * velocity * env;
    }
    this.index = 0;

    this.feedbackGain = feedbackGain;
    this.prevAllpassOut = 0; // for the non-recursive 2-tap damping average
    this.lpCoeff = 1 - Math.exp((-2 * Math.PI * cutoff) / sampleRateHz);
    this.lpState = 0;

    this.age = 0;
    this.maxAge = Math.round(sampleRateHz * (sustainSeconds + TAIL_SECONDS));
    this.releasing = false;
    this.releaseGain = 1;
    this.releaseStep = 1 / (sampleRateHz * RELEASE_SECONDS);
    this.finished = false;
  }

  release() {
    this.releasing = true;
  }

  nextSample() {
    const raw = this.buffer[this.index]; // N-sample-delayed value

    // First-order allpass adds the remaining fractional delay, flat magnitude response.
    const allpassOut = this.allpassC * raw + this.allpassPrevIn - this.allpassC * this.allpassPrevOut;
    this.allpassPrevIn = raw;
    this.allpassPrevOut = allpassOut;

    // Non-recursive (FIR) 2-tap moving average of the current and *previous
    // raw allpass output* — NOT the previous damped value, which would make
    // this a recursive one-pole filter with frequency-dependent phase
    // distortion instead of a true linear-phase FIR with an exact,
    // frequency-independent 0.5-sample delay (compensated for above).
    const damped = 0.5 * (allpassOut + this.prevAllpassOut); // gain <=1 at every frequency: unconditionally stable
    this.prevAllpassOut = allpassOut;

    this.buffer[this.index] = damped * this.feedbackGain;
    this.index = (this.index + 1) % this.n;

    this.lpState += this.lpCoeff * (allpassOut - this.lpState); // output-only brightness lowpass
    let out = this.lpState;

    this.age++;
    if (this.releasing) {
      this.releaseGain = Math.max(0, this.releaseGain - this.releaseStep);
      out *= this.releaseGain;
      if (this.releaseGain <= 0) this.finished = true;
    }
    if (this.age >= this.maxAge) this.finished = true;

    return out;
  }
}

class KarplusStrongProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.voices = [];
    this.dcX1 = 0;
    this.dcY1 = 0;
    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  handleMessage(msg) {
    if (msg.type === 'pluck') {
      const voice = new Voice(sampleRate, msg);
      voice.voiceId = msg.voiceId;
      this.voices.push(voice);
      if (this.voices.length > MAX_POLYPHONY) {
        const oldest = this.voices.find((v) => !v.releasing);
        if (oldest) oldest.release();
      }
    } else if (msg.type === 'stop') {
      const voice = this.voices.find((v) => v.voiceId === msg.voiceId);
      if (voice) voice.release();
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0][0];
    output.fill(0);

    for (const voice of this.voices) {
      for (let i = 0; i < output.length; i++) {
        output[i] += voice.nextSample();
      }
    }

    // DC-blocking highpass + headroom, applied once on the summed output.
    for (let i = 0; i < output.length; i++) {
      const x = output[i];
      const y = x - this.dcX1 + DC_BLOCKER_R * this.dcY1;
      this.dcX1 = x;
      this.dcY1 = y;
      output[i] = y * 0.8;
    }

    if (this.voices.some((v) => v.finished)) {
      this.voices = this.voices.filter((v) => !v.finished);
    }

    return true; // persistent node, reused for every pluck
  }
}

registerProcessor('karplus-strong-processor', KarplusStrongProcessor);
