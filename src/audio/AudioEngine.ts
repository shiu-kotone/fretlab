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
    guitarGain = audioContext.createGain();
    guitarGain.connect(audioContext.destination);
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

/**
 * Common unlock path for the first user gesture (SPEC §4.4/§7): resumes a
 * suspended AudioContext and requests iOS's `playback` audio session type so
 * sound is audible even with the silent switch engaged, where supported.
 */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  const nav = navigator as NavigatorWithAudioSession;
  if (nav.audioSession) {
    try {
      nav.audioSession.type = 'playback';
    } catch {
      // Unsupported: silent-switch behavior is out of our control on this device.
    }
  }
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  unlocked = true;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
