import { describe, it, expect, beforeEach } from 'vitest';
import { useFretboardStore } from './fretboardStore';

describe('useFretboardStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useFretboardStore.setState({
      stringOrientation: '1-top',
      zoomFrets: 12,
      labelMode: 'natural',
      overlayMode: 'off',
      degree: { rootMidi: null, degrees: [] },
      scale: { rootPc: 0, scaleId: 'major' },
      scaleLabelMode: 'degree',
      positionBox: 'all',
    });
  });

  it('toggles string orientation', () => {
    useFretboardStore.getState().setStringOrientation('6-top');
    expect(useFretboardStore.getState().stringOrientation).toBe('6-top');
  });

  it('sets zoom fret count', () => {
    useFretboardStore.getState().setZoomFrets(22);
    expect(useFretboardStore.getState().zoomFrets).toBe(22);
  });

  it('setting a degree root defaults degrees to [R] if none selected yet', () => {
    useFretboardStore.getState().setDegreeRoot(64);
    const { degree } = useFretboardStore.getState();
    expect(degree.rootMidi).toBe(64);
    expect(degree.degrees).toEqual([0]);
  });

  it('re-setting the root preserves an existing degree selection', () => {
    useFretboardStore.getState().setDegreeRoot(64);
    useFretboardStore.getState().toggleDegree(7);
    useFretboardStore.getState().setDegreeRoot(67); // change root again
    expect(useFretboardStore.getState().degree.degrees).toEqual([0, 7]);
  });

  it('toggleDegree adds and removes a degree, keeping the list sorted', () => {
    useFretboardStore.getState().setDegreeRoot(64);
    useFretboardStore.getState().toggleDegree(7);
    useFretboardStore.getState().toggleDegree(4);
    expect(useFretboardStore.getState().degree.degrees).toEqual([0, 4, 7]);
    useFretboardStore.getState().toggleDegree(4);
    expect(useFretboardStore.getState().degree.degrees).toEqual([0, 7]);
  });

  it('setDegreesFromPreset replaces the current selection entirely', () => {
    useFretboardStore.getState().setDegreeRoot(64);
    useFretboardStore.getState().toggleDegree(2);
    useFretboardStore.getState().setDegreesFromPreset([0, 4, 7, 11]);
    expect(useFretboardStore.getState().degree.degrees).toEqual([0, 4, 7, 11]);
  });

  it('clearDegrees resets both root and selection', () => {
    useFretboardStore.getState().setDegreeRoot(64);
    useFretboardStore.getState().toggleDegree(7);
    useFretboardStore.getState().clearDegrees();
    expect(useFretboardStore.getState().degree).toEqual({ rootMidi: null, degrees: [] });
  });

  it('setScaleRoot wraps to a valid pitch class', () => {
    useFretboardStore.getState().setScaleRoot(14);
    expect(useFretboardStore.getState().scale.rootPc).toBe(2);
    useFretboardStore.getState().setScaleRoot(-1);
    expect(useFretboardStore.getState().scale.rootPc).toBe(11);
  });

  it('setScaleType updates only the scale id, keeping the root', () => {
    useFretboardStore.getState().setScaleRoot(5);
    useFretboardStore.getState().setScaleType('minor-pentatonic');
    expect(useFretboardStore.getState().scale).toEqual({ rootPc: 5, scaleId: 'minor-pentatonic' });
  });

  it('setPositionBox accepts a specific box or "all"', () => {
    useFretboardStore.getState().setPositionBox(3);
    expect(useFretboardStore.getState().positionBox).toBe(3);
    useFretboardStore.getState().setPositionBox('all');
    expect(useFretboardStore.getState().positionBox).toBe('all');
  });
});
