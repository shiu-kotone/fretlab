import { create } from 'zustand';

export type ProgressionScreen = 'list' | 'editor' | 'player';

interface ProgressionUiState {
  screen: ProgressionScreen;
  /** The preset id ("preset:...") or user progression id currently open. */
  selectedId: string | null;
  openList: () => void;
  openEditor: (id: string) => void;
  openPlayer: (id: string) => void;
}

/**
 * In-memory (not persisted) navigation state for the progression feature.
 * Kept in a store rather than component state so it survives the coord tab
 * unmounting on tab switch (SPEC §3.1 tab bar unmounts inactive tabs).
 */
export const useProgressionUiStore = create<ProgressionUiState>((set) => ({
  screen: 'list',
  selectedId: null,

  openList: () => set({ screen: 'list', selectedId: null }),
  openEditor: (id) => set({ screen: 'editor', selectedId: id }),
  openPlayer: (id) => set({ screen: 'player', selectedId: id }),
}));
