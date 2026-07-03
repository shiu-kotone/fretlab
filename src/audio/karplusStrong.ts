import { midiToFreq, type Midi } from '../theory/pitch';

/** SPEC §4.4: guitar synth polyphony cap; oldest voice is released past this. */
export const MAX_POLYPHONY = 12;

const NOISE_BURST_DURATION = 0.004;
const RELEASE_TAIL_SECONDS = 0.03;

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
  const maxCutoff = 9000;
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

function createNoiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Karplus-Strong string synth (SPEC §4.4): a short noise burst excites a
 * DelayNode → BiquadFilter(lowpass) → GainNode feedback loop — the classic
 * "noise burst + delay line + lowpass feedback" technique, built entirely
 * from native Web Audio nodes (no AudioWorklet, no sample playback).
 */
export class KarplusStrongSynth {
  private voices: Voice[] = [];

  constructor(
    private ctx: BaseAudioContext,
    private destination: AudioNode,
  ) {}

  pluck(midi: Midi, opts: PluckOptions = {}): void {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const freq = midiToFreq(midi, opts.a4 ?? 440);
    const velocity = computeVelocityGain(opts.velocity ?? 0.8);
    const sustainSeconds = clampSustainSeconds(opts.sustainSeconds ?? 2);
    const delayTime = 1 / freq;
    const feedbackGain = computeFeedbackGain(delayTime, sustainSeconds);
    const cutoff = computeLowpassCutoff(freq, opts.brightness ?? 0.5);

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, NOISE_BURST_DURATION);

    const excitationGain = ctx.createGain();
    excitationGain.gain.value = velocity;

    const delay = ctx.createDelay(1);
    delay.delayTime.value = delayTime;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = cutoff;

    const feedback = ctx.createGain();
    feedback.gain.value = feedbackGain;

    const output = ctx.createGain();
    output.gain.value = 1;

    noise.connect(excitationGain);
    excitationGain.connect(delay);
    delay.connect(lowpass);
    lowpass.connect(feedback);
    feedback.connect(delay);
    lowpass.connect(output);
    output.connect(this.destination);

    noise.start(now);
    noise.stop(now + NOISE_BURST_DURATION);

    const naturalEnd = now + sustainSeconds + 0.5;
    output.gain.setValueAtTime(1, naturalEnd - RELEASE_TAIL_SECONDS);
    output.gain.linearRampToValueAtTime(0, naturalEnd);

    const release = (when: number) => {
      try {
        output.gain.cancelScheduledValues(when);
        output.gain.setValueAtTime(output.gain.value, when);
        output.gain.linearRampToValueAtTime(0, when + RELEASE_TAIL_SECONDS);
        window.setTimeout(() => {
          feedback.disconnect();
          delay.disconnect();
          lowpass.disconnect();
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
  }
}
