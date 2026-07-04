import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChordTypeId } from '../theory/chords';

export interface FavoriteChord {
  root: number;
  typeId: ChordTypeId;
  voicingIndex: number;
}

interface ChordLibraryState {
  selectedRoot: number;
  selectedType: ChordTypeId;
  selectedVoicingIndex: number;
  favorites: FavoriteChord[];
  showFavoritesOnly: boolean;

  setSelectedRoot: (root: number) => void;
  setSelectedType: (type: ChordTypeId) => void;
  setSelectedVoicingIndex: (index: number) => void;
  toggleFavorite: (root: number, typeId: ChordTypeId, voicingIndex: number) => void;
  setShowFavoritesOnly: (v: boolean) => void;
}

function favoriteKey(root: number, typeId: ChordTypeId, voicingIndex: number): string {
  return `${root}-${typeId}-${voicingIndex}`;
}

export function isFavoriteChord(
  favorites: FavoriteChord[],
  root: number,
  typeId: ChordTypeId,
  voicingIndex: number,
): boolean {
  const key = favoriteKey(root, typeId, voicingIndex);
  return favorites.some((f) => favoriteKey(f.root, f.typeId, f.voicingIndex) === key);
}

export const useChordLibraryStore = create<ChordLibraryState>()(
  persist(
    (set) => ({
      selectedRoot: 0,
      selectedType: 'maj',
      selectedVoicingIndex: 0,
      favorites: [],
      showFavoritesOnly: false,

      setSelectedRoot: (root) => set({ selectedRoot: root, selectedVoicingIndex: 0 }),
      setSelectedType: (type) => set({ selectedType: type, selectedVoicingIndex: 0 }),
      setSelectedVoicingIndex: (index) => set({ selectedVoicingIndex: index }),

      toggleFavorite: (root, typeId, voicingIndex) =>
        set((s) => {
          const key = favoriteKey(root, typeId, voicingIndex);
          const exists = s.favorites.some((f) => favoriteKey(f.root, f.typeId, f.voicingIndex) === key);
          return {
            favorites: exists
              ? s.favorites.filter((f) => favoriteKey(f.root, f.typeId, f.voicingIndex) !== key)
              : [...s.favorites, { root, typeId, voicingIndex }],
          };
        }),

      setShowFavoritesOnly: (v) => set({ showFavoritesOnly: v }),
    }),
    { name: 'fretlab-chord-library' },
  ),
);
