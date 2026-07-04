import { describe, it, expect, beforeEach } from 'vitest';
import { useChordLibraryStore, isFavoriteChord } from './chordLibraryStore';

describe('useChordLibraryStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useChordLibraryStore.setState({
      selectedRoot: 0,
      selectedType: 'maj',
      selectedVoicingIndex: 0,
      favorites: [],
      showFavoritesOnly: false,
    });
  });

  it('selecting a new root resets the voicing index', () => {
    useChordLibraryStore.getState().setSelectedVoicingIndex(2);
    useChordLibraryStore.getState().setSelectedRoot(5);
    expect(useChordLibraryStore.getState().selectedVoicingIndex).toBe(0);
  });

  it('selecting a new type resets the voicing index', () => {
    useChordLibraryStore.getState().setSelectedVoicingIndex(3);
    useChordLibraryStore.getState().setSelectedType('m7');
    expect(useChordLibraryStore.getState().selectedVoicingIndex).toBe(0);
  });

  it('toggleFavorite adds then removes a favorite', () => {
    useChordLibraryStore.getState().toggleFavorite(0, 'maj', 0);
    expect(useChordLibraryStore.getState().favorites).toHaveLength(1);
    useChordLibraryStore.getState().toggleFavorite(0, 'maj', 0);
    expect(useChordLibraryStore.getState().favorites).toHaveLength(0);
  });

  it('favorites are distinguished by (root, type, voicingIndex)', () => {
    useChordLibraryStore.getState().toggleFavorite(0, 'maj', 0);
    useChordLibraryStore.getState().toggleFavorite(0, 'maj', 1);
    expect(useChordLibraryStore.getState().favorites).toHaveLength(2);
  });
});

describe('isFavoriteChord', () => {
  it('finds a matching favorite', () => {
    const favorites = [{ root: 4, typeId: 'm7' as const, voicingIndex: 1 }];
    expect(isFavoriteChord(favorites, 4, 'm7', 1)).toBe(true);
    expect(isFavoriteChord(favorites, 4, 'm7', 0)).toBe(false);
    expect(isFavoriteChord(favorites, 5, 'm7', 1)).toBe(false);
  });
});
