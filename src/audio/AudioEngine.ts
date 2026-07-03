/**
 * Single shared AudioContext for the whole app (SPEC §4.4). All features
 * (metronome, guitar synth, progression player, ...) must route through
 * getClickGain()/getGuitarGain() rather than creating their own context.
 */

import { KarplusStrongSynth } from './karplusStrong';

interface NavigatorWithAudioSession extends Navigator {
  audioSession?: { type: string };
}

let audioContext: AudioContext | null = null;
let clickGain: GainNode | null = null;
let guitarGain: GainNode | null = null;
let guitarSynth: KarplusStrongSynth | null = null;
let unlocked = false;

function createContext(): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctor();
}

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = createContext();
    clickGain = audioContext.createGain();
    clickGain.connect(audioContext.destination);

    // The guitar synth is legitimately polyphonic (chords, rapid restrikes,
    // an overlapping repeat/tap) — several Karplus-Strong voices summing on
    // one bus can exceed 0dBFS and hard-clip into harsh digital noise. A
    // gentle compressor on the bus acts as a safety limiter so that stays
    // clean without audibly coloring a single note.
    guitarGain = audioContext.createGain();
    const guitarCompressor = audioContext.createDynamicsCompressor();
    guitarCompressor.threshold.value = -12;
    guitarCompressor.knee.value = 6;
    guitarCompressor.ratio.value = 12;
    guitarCompressor.attack.value = 0.003;
    guitarCompressor.release.value = 0.25;
    guitarGain.connect(guitarCompressor);
    guitarCompressor.connect(audioContext.destination);
  }
  return audioContext;
}

export function getClickGain(): GainNode {
  getAudioContext();
  return clickGain!;
}

export function getGuitarGain(): GainNode {
  getAudioContext();
  return guitarGain!;
}

/** Shared Karplus-Strong voice (SPEC §4.4/§8 Phase 0 demo), routed through the guitar master gain. */
export function getGuitarSynth(): KarplusStrongSynth {
  const ctx = getAudioContext();
  if (!guitarSynth) {
    guitarSynth = new KarplusStrongSynth(ctx, getGuitarGain());
  }
  return guitarSynth;
}

export function setClickVolume(volume0to100: number): void {
  getClickGain().gain.value = Math.max(0, Math.min(1, volume0to100 / 100));
}

export function setGuitarVolume(volume0to100: number): void {
  getGuitarGain().gain.value = Math.max(0, Math.min(1, volume0to100 / 100));
}

export type AudioSessionType = 'playback' | 'play-and-record';

/**
 * SPEC §4.4/§7: iOS's `playback` audio session category is what makes sound
 * audible even with the silent switch engaged — but it's output-only and is
 * *incompatible* with microphone capture (attempting getUserMedia while it's
 * active throws `InvalidStateError: AudioSession category is not compatible
 * with audio capture`). The tuner must switch to `play-and-record` before
 * requesting the mic, and switch back once it's done so playback elsewhere
 * in the app keeps bypassing the silent switch.
 */
export function setAudioSessionType(type: AudioSessionType): void {
  const nav = navigator as NavigatorWithAudioSession;
  if (nav.audioSession) {
    try {
      nav.audioSession.type = type;
    } catch {
      // Unsupported: silent-switch/mic-session behavior is out of our control on this device.
    }
  }
}

/** Common unlock path for the first user gesture (SPEC §4.4/§7): resumes a suspended AudioContext. */
export async function unlockAudio(opts: { audioSessionType?: AudioSessionType } = {}): Promise<void> {
  const ctx = getAudioContext();
  setAudioSessionType(opts.audioSessionType ?? 'playback');
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  unlocked = true;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
