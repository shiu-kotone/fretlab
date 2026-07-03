import { describe, it, expect } from 'vitest';
import {
  midiToFreq,
  freqToNearestNote,
  noteName,
  fretToMidi,
  interval,
  isNaturalPitchClass,
  REGULAR_TUNING,
} from './pitch';

describe('midiToFreq', () => {
  it('A4 (midi 69) is 440Hz by default', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });

  it('one octave up doubles frequency', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 5);
  });

  it('respects a custom A4 reference pitch', () => {
    expect(midiToFreq(69, 442)).toBeCloseTo(442, 5);
  });
});

describe('freqToNearestNote / midiToFreq round trip', () => {
  it('round-trips within a small error margin for all guitar-range midi notes', () => {
    for (let midi = 40; midi <= 88; midi++) {
      const freq = midiToFreq(midi);
      const { midi: detected, cents } = freqToNearestNote(freq);
      expect(detected).toBe(midi);
      expect(Math.abs(cents)).toBeLessThan(0.001);
    }
  });

  it('reports cents offset for a detuned frequency', () => {
    const freq = midiToFreq(69) * Math.pow(2, 10 / 1200); // +10 cents from A4
    const { midi, cents } = freqToNearestNote(freq);
    expect(midi).toBe(69);
    expect(cents).toBeCloseTo(10, 1);
  });
});

describe('noteName', () => {
  it('formats sharp English names', () => {
    expect(noteName(61, { flat: false, solfege: false })).toBe('C#4');
  });

  it('formats flat English names', () => {
    expect(noteName(61, { flat: true, solfege: false })).toBe('D♭4');
  });

  it('formats solfege names', () => {
    expect(noteName(60, { flat: false, solfege: true })).toBe('ド4');
  });
});

describe('fretToMidi', () => {
  it('open low E string is midi 40', () => {
    expect(fretToMidi(0, 0, REGULAR_TUNING)).toBe(40);
  });

  it('12th fret is an octave above the open string', () => {
    expect(fretToMidi(5, 12, REGULAR_TUNING)).toBe(REGULAR_TUNING[5] + 12);
  });
});

describe('interval', () => {
  it('returns 0 for unison', () => {
    expect(interval(60, 60)).toBe(0);
  });

  it('returns 7 for a perfect fifth', () => {
    expect(interval(60, 67)).toBe(7);
  });

  it('wraps negative distances into 0-11', () => {
    expect(interval(60, 48)).toBe(0);
    expect(interval(61, 60)).toBe(11);
  });
});

describe('isNaturalPitchClass', () => {
  it('is true for the 7 natural notes (C D E F G A B)', () => {
    for (const pc of [0, 2, 4, 5, 7, 9, 11]) {
      expect(isNaturalPitchClass(pc)).toBe(true);
    }
  });

  it('is false for the 5 sharp/flat notes', () => {
    for (const pc of [1, 3, 6, 8, 10]) {
      expect(isNaturalPitchClass(pc)).toBe(false);
    }
  });

  it('wraps pitch classes outside 0-11', () => {
    expect(isNaturalPitchClass(12)).toBe(true); // wraps to 0 (C)
    expect(isNaturalPitchClass(-1)).toBe(true); // wraps to 11 (B)
    expect(isNaturalPitchClass(13)).toBe(false); // wraps to 1 (C#)
  });
});
