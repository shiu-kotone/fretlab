import { midiToFreq, type Midi } from '../theory/pitch';

/**
 * Feedback gain for a Karplus-Strong delay loop: the amplitude should fall
 * by -60dB (0.001) after `sustainSeconds`, applied once per period.
 */
export function computeFeedbackGain(periodSeconds: number, sustainSeconds: number): number {
  return Math.pow(0.001, periodSeconds / sustainSeconds);
}

/**
 * Maps the 0-1 "brightness" parameter (SPEC §4.4) to a lowpass cutoff in Hz.
 * The floor tracks the note's fundamental so low notes are never muffled
 * into silence by an overly dark brightness setting.
 */
export function computeLowpassCutoff(freq: number, brightness: number): number {
  const b = Math.min(1, Math.max(0, brightness));
  const minCutoff = Math.max(freq * 1.5, 400);
  const maxCutoff = 7000;
  return minCutoff + b * (maxCutoff - minCutoff);
}

export function computeVelocityGain(velocity: number): number {
  return Math.min(1, Math.max(0, velocity));
}

export function clampSustainSeconds(sustainSeconds: number): number {
  return Math.min(3, Math.max(1.5, sustainSeconds));
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

export interface PluckHandle {
  /** Fades the voice out quickly (~30ms, click-free) and stops it immediately, instead of waiting for its natural decay. */
  stop: () => void;
}

let nextVoiceId = 1;

/**
 * Karplus-Strong string synth (SPEC §4.4). The actual synthesis (fractional
 * delay line, damping filter, brightness filter, DC blocker, polyphony) runs
 * inside an AudioWorkletProcessor —
 * public/audio-worklets/karplus-strong-processor.js — not a plain
 * BiquadFilter/DelayNode graph. A native DelayNode feedback loop has a fixed
 * ~128-sample (one render-quantum) minimum round-trip latency, which for a
 * multi-second sustain (per-loop feedback gain near 1) leaves no headroom to
 * compensate once a note's period drops below that floor: every note above
 * roughly F#4 collapsed to the same fixed ~350Hz pitch. An
 * AudioWorkletProcessor manages its own buffer with no such floor, giving
 * accurate pitch across the full fretboard range. This class just computes
 * ready-to-use DSP parameters (via the pure functions above) and
 * message-passes them to a single persistent AudioWorkletNode.
 */
export class KarplusStrongSynth {
  private node: AudioWorkletNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.node = new AudioWorkletNode(ctx, 'karplus-strong-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    this.node.connect(destination);
  }

  pluck(midi: Midi, opts: PluckOptions = {}): PluckHandle {
    const freq = midiToFreq(midi, opts.a4 ?? 440);
    const velocity = computeVelocityGain(opts.velocity ?? 0.8);
    const sustainSeconds = clampSustainSeconds(opts.sustainSeconds ?? 2);
    const periodSeconds = 1 / freq;
    const feedbackGain = computeFeedbackGain(periodSeconds, sustainSeconds);
    const cutoff = computeLowpassCutoff(freq, opts.brightness ?? 0.5);
    const voiceId = nextVoiceId++;

    this.node.port.postMessage({
      type: 'pluck',
      voiceId,
      frequency: freq,
      feedbackGain,
      cutoff,
      velocity,
      sustainSeconds,
    });

    return {
      stop: () => {
        this.node.port.postMessage({ type: 'stop', voiceId });
      },
    };
  }

  /**
   * SPEC-adjacent POLISH.md R3-2: releases every currently-ringing voice over
   * a short window instead of their normal multi-second sustain, so a chord
   * change doesn't leave the previous chord's strings ringing into the new
   * one. Call this right before the first strum of a new chord segment (not
   * on repeated strums within the same chord, and never during arpeggio
   * patterns, where the overlap is intentional).
   */
  dampAll(releaseSeconds = 0.05): void {
    this.node.port.postMessage({ type: 'dampAll', releaseSeconds });
  }
}
