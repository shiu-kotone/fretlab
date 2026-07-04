import { create } from 'zustand';

export type PlaybackOwner = 'metronome' | 'progression';

interface PlaybackCoordinatorState {
  activeOwner: PlaybackOwner | null;
  /** Claims exclusive playback; the previous owner (if any) must react by stopping itself. */
  claim: (owner: PlaybackOwner) => void;
  release: (owner: PlaybackOwner) => void;
}

/**
 * SPEC §4.5 "発音の衝突ルール": metronome and progression playback never run
 * simultaneously — starting one stops the other. Each engine claims
 * ownership on start and watches `activeOwner`, stopping itself if it's no
 * longer the owner, without either feature importing the other's internals.
 */
export const usePlaybackCoordinatorStore = create<PlaybackCoordinatorState>((set) => ({
  activeOwner: null,
  claim: (owner) => set({ activeOwner: owner }),
  release: (owner) => set((s) => (s.activeOwner === owner ? { activeOwner: null } : s)),
}));
