import { midiToFreq, type Midi } from '../theory/pitch';

/** SPEC §4.4: guitar synth polyphony cap; oldest voice is released past this. */
export const MAX_POLYPHONY = 12;

const NOISE_BURST_DURATION = 0.004;
const RELEASE_TAIL_SECONDS = 0.03;
/** Safety DC-blocker on the audible output tap, to prevent low-end buildup reading as "muddy". */
const DC_BLOCKER_FREQUENCY = 20;

/**
 * Feedback gain for a DelayNode-based Karplus-Strong loop: the amplitude
 * should fall by -60dB (0.001) after `sustainSeconds`, and the loop applies
 * this gain once per `delayTimeSeconds` (one period of the plucked note).
 */
export function computeFeedbackGain(delayTimeSeconds: number, sustainSeconds: number): number {
  return Math.pow(0.001, delayTimeSeconds / sustainSeconds);
}

/**
 * Maps the 0-1 "brightness" parameter (SPEC §4.4) to a lowpass cutoff in Hz.
 * The floor tracks the note's fundamental so low notes are never muffled
 * into silence by an overly dark brightness setting.
 */
export function computeLowpassCutoff(freq: number, brightness: number): number {
  const b = Math.min(1, Math.max(0, brightness));
  const minCutoff = Math.max(freq * 1.5, 400);
  // Lowered from a brighter 9kHz ceiling, which read as shrill on phone speakers.
  const maxCutoff = 7000;
  return minCutoff + b * (maxCutoff - minCutoff);
}

export function computeVelocityGain(velocity: number): number {
  return Math.min(1, Math.max(0, velocity));
}

export function clampSustainSeconds(sustainSeconds: number): number {
  return Math.min(3, Math.max(1.5, sustainSeconds));
}

/**
 * Appends a voice to a polyphony-limited list, releasing (and dropping) the
 * oldest voice once the limit is exceeded. Pure/generic so the eviction
 * policy is testable without a real AudioContext.
 */
export function pushVoiceWithLimit<T>(
  voices: T[],
  voice: T,
  maxPolyphony: number,
  releaseVoice: (v: T) => void,
): T[] {
  const next = [...voices, voice];
  if (next.length > maxPolyphony) {
    const [oldest, ...rest] = next;
    releaseVoice(oldest);
    return rest;
  }
  return next;
}

export interface PluckOptions {
  /** 0-1, default 0.8. */
  velocity?: number;
  /** 0 (dark) - 1 (bright), default 0.5. */
  brightness?: number;
  /** Seconds, clamped to 1.5-3 (SPEC §4.4). Default 2. */
  sustainSeconds?: number;
  a4?: number;
}

interface Voice {
  release: (when: number) => void;
}

export interface PluckHandle {
  /** Fades the voice out quickly (~30ms, click-free) and stops it immediately, instead of waiting for its natural decay. */
  stop: () => void;
}

/**
 * Amplitude envelope (0-1 per sample) for the noise-burst excitation. A bare
 * rectangular noise gate has a hard onset/offset that reads as an audible
 * "tick" layered on top of the pluck; a short taper removes that without
 * softening the transient enough to lose the pluck's attack character.
 */
export function noiseBurstEnvelope(length: number): Float32Array {
  const env = new Float32Array(length);
  const attackSamples = Math.max(1, Math.floor(length * 0.15));
  const releaseStart = Math.floor(length * 0.7);
  const releaseSamples = Math.max(1, length - releaseStart);
  for (let i = 0; i < length; i++) {
    if (i < attackSamples) {
      env[i] = i / attackSamples;
    } else if (i >= releaseStart) {
      env[i] = 1 - (i - releaseStart) / releaseSamples;
    } else {
      env[i] = 1;
    }
  }
  return env;
}

function createNoiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const envelope = noiseBurstEnvelope(length);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * envelope[i];
  }
  return buffer;
}

/**
 * Karplus-Strong string synth (SPEC §4.4): a short noise burst excites a
 * delay-line feedback loop, built entirely from native Web Audio nodes (no
 * AudioWorklet, no sample playback).
 *
 * The loop's damping filter is a plain 2-tap moving average (0.5·x[n] +
 * 0.5·x[n-1]), not a BiquadFilterNode — measured empirically
 * (`BiquadFilterNode.getFrequencyResponse`), Chromium's lowpass has passband
 * gain measurably above 1.0 (up to ~1.2x) even at a non-resonant Q. Inside a
 * feedback loop tuned for a multi-second decay (per-loop gain ≈0.96-0.997),
 * that excess gain makes the loop's total gain exceed 1 and grow without
 * bound — inaudible as clipping distortion once the shared bus compressor
 * clamps it, which is what made the tone sound harsh/noisy. A 2-tap average
 * has gain \|cos(ω/2)\| ≤ 1 at every frequency by construction, so the loop
 * is unconditionally stable regardless of any node's implementation
 * quirks — and it's the same damping filter the original Karplus-Strong
 * algorithm uses, which also happens to sound more natural than a resonant
 * filter (higher harmonics decay faster than the fundamental, like a real
 * string). "Brightness" is applied by a *separate* lowpass on the output
 * tap, after the loop — since it doesn't recirculate, its gain can't
 * destabilize anything.
 */
export class KarplusStrongSynth {
  private voices: Voice[] = [];

  constructor(
    private ctx: BaseAudioContext,
    private destination: AudioNode,
  ) {}

  pluck(midi: Midi, opts: PluckOptions = {}): PluckHandle {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const freq = midiToFreq(midi, opts.a4 ?? 440);
    const velocity = computeVelocityGain(opts.velocity ?? 0.8);
    const sustainSeconds = clampSustainSeconds(opts.sustainSeconds ?? 2);
    const delayTime = 1 / freq;
    const feedbackGain = computeFeedbackGain(delayTime, sustainSeconds);
    const cutoff = computeLowpassCutoff(freq, opts.brightness ?? 0.5);
    const tapDelayTime = 1 / ctx.sampleRate;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, NOISE_BURST_DURATION);

    const excitationGain = ctx.createGain();
    excitationGain.gain.value = velocity;

    const mainDelay = ctx.createDelay(1);
    // Compensate for the averaging filter's own ~0.5-sample group delay so
    // the loop period (and therefore pitch) matches `freq`.
    mainDelay.delayTime.value = Math.max(0, delayTime - 0.5 * tapDelayTime);

    // 2-tap moving average: direct copy + a 1-sample-delayed copy, each at
    // half gain. Both destinations below receive this same summed signal.
    const directGain = ctx.createGain();
    directGain.gain.value = 0.5;
    const tapDelay = ctx.createDelay(1);
    tapDelay.delayTime.value = tapDelayTime;
    const tapGain = ctx.createGain();
    tapGain.gain.value = 0.5;

    const feedback = ctx.createGain();
    feedback.gain.value = feedbackGain;

    // Output-only brightness control — outside the feedback loop, so its
    // gain characteristics (whatever they are on a given engine) can only
    // color the already-decaying signal, never destabilize the loop.
    const brightnessFilter = ctx.createBiquadFilter();
    brightnessFilter.type = 'lowpass';
    brightnessFilter.frequency.value = cutoff;
    brightnessFilter.Q.value = 0.7;

    const dcBlocker = ctx.createBiquadFilter();
    dcBlocker.type = 'highpass';
    dcBlocker.frequency.value = DC_BLOCKER_FREQUENCY;
    dcBlocker.Q.value = 0.5;

    const output = ctx.createGain();
    // Headroom below unity: several voices can legitimately overlap (a chord,
    // rapid restrikes) and sum on the shared guitar bus; this plus the
    // DynamicsCompressorNode in AudioEngine keeps that from hard-clipping.
    output.gain.value = 0.8;

    noise.connect(excitationGain);
    excitationGain.connect(mainDelay);

    mainDelay.connect(directGain);
    mainDelay.connect(tapDelay);
    tapDelay.connect(tapGain);

    directGain.connect(feedback);
    tapGain.connect(feedback);
    feedback.connect(mainDelay);

    directGain.connect(brightnessFilter);
    tapGain.connect(brightnessFilter);
    brightnessFilter.connect(dcBlocker);
    dcBlocker.connect(output);
    output.connect(this.destination);

    noise.start(now);
    noise.stop(now + NOISE_BURST_DURATION);

    const naturalEnd = now + sustainSeconds + 0.5;
    output.gain.setValueAtTime(0.8, naturalEnd - RELEASE_TAIL_SECONDS);
    output.gain.linearRampToValueAtTime(0, naturalEnd);

    const release = (when: number) => {
      try {
        output.gain.cancelScheduledValues(when);
        output.gain.setValueAtTime(output.gain.value, when);
        output.gain.linearRampToValueAtTime(0, when + RELEASE_TAIL_SECONDS);
        window.setTimeout(() => {
          feedback.disconnect();
          mainDelay.disconnect();
          directGain.disconnect();
          tapDelay.disconnect();
          tapGain.disconnect();
          brightnessFilter.disconnect();
          dcBlocker.disconnect();
          output.disconnect();
        }, RELEASE_TAIL_SECONDS * 1000 + 20);
      } catch {
        // Nodes may already be disconnected if release() runs twice; harmless.
      }
    };

    const voice: Voice = { release };
    this.voices = pushVoiceWithLimit(this.voices, voice, MAX_POLYPHONY, (v) => v.release(now));

    window.setTimeout(
      () => {
        this.voices = this.voices.filter((v) => v !== voice);
      },
      (naturalEnd - now) * 1000 + 100,
    );

    return {
      stop: () => {
        release(this.ctx.currentTime);
        this.voices = this.voices.filter((v) => v !== voice);
      },
    };
  }
}
