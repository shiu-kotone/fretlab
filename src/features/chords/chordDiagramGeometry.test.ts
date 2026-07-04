import { describe, it, expect } from 'vitest';
import { stringX, fretRowY, fretToRow, dotY, STRING_MARGIN, DIAGRAM_WIDTH, TOP_LABEL_HEIGHT, FRET_HEIGHT } from './chordDiagramGeometry';

describe('stringX', () => {
  it('places string 0 (6th/low E) at the left margin', () => {
    expect(stringX(0)).toBe(STRING_MARGIN);
  });

  it('places string 5 (1st/high e) at the right margin', () => {
    expect(stringX(5)).toBe(DIAGRAM_WIDTH - STRING_MARGIN);
  });

  it('strings are evenly spaced and ascending left to right', () => {
    for (let i = 1; i < 6; i++) {
      expect(stringX(i)).toBeGreaterThan(stringX(i - 1));
    }
  });
});

describe('fretRowY / fretToRow', () => {
  it('row 0 is the nut/top line', () => {
    expect(fretRowY(0)).toBe(TOP_LABEL_HEIGHT);
  });

  it('rows increase downward by FRET_HEIGHT', () => {
    expect(fretRowY(1) - fretRowY(0)).toBe(FRET_HEIGHT);
  });

  it('maps a fret at baseFret to row 1', () => {
    expect(fretToRow(3, 3)).toBe(1);
    expect(fretToRow(8, 8)).toBe(1);
  });

  it('maps a fret above baseFret to a higher row', () => {
    expect(fretToRow(5, 3)).toBe(3);
  });

  it('returns null for a fret below baseFret', () => {
    expect(fretToRow(2, 3)).toBeNull();
  });

  it('returns null for a fret far beyond the visible grid', () => {
    expect(fretToRow(20, 1)).toBeNull();
  });
});

describe('dotY', () => {
  it('centers the dot within its fret row', () => {
    expect(dotY(1)).toBe(fretRowY(0) + FRET_HEIGHT / 2);
  });
});
