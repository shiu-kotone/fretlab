import { create } from 'zustand';

interface MetronomeControlState {
  /** Published by the always-mounted MetronomeView's engine instance (SPEC §4.5/§5.6 "録音画面からメトロノームを起動可"); null while it isn't mounted. */
  toggle: (() => void) | null;
  setToggle: (fn: (() => void) | null) => void;
}

/**
 * A second `useMetronomeEngine()` instance would create a second, independent
 * LookaheadScheduler — since MetronomeView stays mounted app-wide specifically
 * to keep playback alive across tab switches, other features (the recorder)
 * must control that one true instance rather than spawning their own.
 */
export const useMetronomeControlStore = create<MetronomeControlState>((set) => ({
  toggle: null,
  setToggle: (fn) => set({ toggle: fn }),
}));
