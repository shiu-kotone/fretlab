import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackCoordinatorStore } from './playbackCoordinatorStore';

describe('usePlaybackCoordinatorStore', () => {
  beforeEach(() => {
    usePlaybackCoordinatorStore.setState({ activeOwner: null });
  });

  it('starts with no active owner', () => {
    expect(usePlaybackCoordinatorStore.getState().activeOwner).toBeNull();
  });

  it('claim() sets the active owner, pre-empting any previous one', () => {
    usePlaybackCoordinatorStore.getState().claim('metronome');
    expect(usePlaybackCoordinatorStore.getState().activeOwner).toBe('metronome');
    usePlaybackCoordinatorStore.getState().claim('progression');
    expect(usePlaybackCoordinatorStore.getState().activeOwner).toBe('progression');
  });

  it('release() only clears the owner if it matches', () => {
    usePlaybackCoordinatorStore.getState().claim('metronome');
    usePlaybackCoordinatorStore.getState().release('progression');
    expect(usePlaybackCoordinatorStore.getState().activeOwner).toBe('metronome');
    usePlaybackCoordinatorStore.getState().release('metronome');
    expect(usePlaybackCoordinatorStore.getState().activeOwner).toBeNull();
  });

  it('notifies subscribers when pre-empted', () => {
    usePlaybackCoordinatorStore.getState().claim('metronome');
    const seen: (string | null)[] = [];
    const unsub = usePlaybackCoordinatorStore.subscribe((s) => seen.push(s.activeOwner));
    usePlaybackCoordinatorStore.getState().claim('progression');
    unsub();
    expect(seen).toEqual(['progression']);
  });
});
