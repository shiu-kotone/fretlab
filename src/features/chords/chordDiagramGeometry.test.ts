import { describe, it, expect } from 'vitest';
import {
  stringRow,
  stringY,
  gridTopY,
  gridBottomY,
  fretColX,
  fretToCol,
  dotX,
  stringNumberX,
  stringNumberLabel,
  markX,
  labelX,
  diagramWidth,
  TOP_MARGIN,
  STRING_SPACING,
  LEFT_MARGIN,
  FRET_WIDTH,
} from './chordDiagramGeometry';

describe('stringRow / stringY', () => {
  it('places string 0 (6th/low E) on the bottom row', () => {
    expect(stringRow(0)).toBe(5);
  });

  it('places string 5 (1st/high e) on the top row', () => {
    expect(stringRow(5)).toBe(0);
  });

  it('rows are evenly spaced, ascending in y from top (string 5) to bottom (string 0)', () => {
    for (let s = 5; s > 0; s--) {
      expect(stringY(s)).toBeLessThan(stringY(s - 1));
    }
  });

  it('top row sits at TOP_MARGIN', () => {
    expect(stringY(5)).toBe(TOP_MARGIN);
  });

  it('rows step by STRING_SPACING', () => {
    expect(stringY(4) - stringY(5)).toBe(STRING_SPACING);
  });
});

describe('gridTopY / gridBottomY', () => {
  it('matches the top and bottom string rows', () => {
    expect(gridTopY()).toBe(stringY(5));
    expect(gridBottomY()).toBe(stringY(0));
  });
});

describe('fretColX / fretToCol', () => {
  it('col 0 is the nut, at LEFT_MARGIN', () => {
    expect(fretColX(0)).toBe(LEFT_MARGIN);
  });

  it('columns increase rightward by FRET_WIDTH', () => {
    expect(fretColX(1) - fretColX(0)).toBe(FRET_WIDTH);
  });

  it('maps a fret at baseFret to col 1', () => {
    expect(fretToCol(3, 3)).toBe(1);
    expect(fretToCol(8, 8)).toBe(1);
  });

  it('maps a fret above baseFret to a higher column', () => {
    expect(fretToCol(5, 3)).toBe(3);
  });

  it('returns null for a fret below baseFret', () => {
    expect(fretToCol(2, 3)).toBeNull();
  });

  it('returns null for a fret far beyond the visible grid', () => {
    expect(fretToCol(20, 1)).toBeNull();
  });
});

describe('dotX', () => {
  it('centers the dot within its fret column', () => {
    expect(dotX(1)).toBe(fretColX(0) + FRET_WIDTH / 2);
  });
});

describe('nut-side label columns', () => {
  it('string number column sits left of the mark column, which sits left of the nut', () => {
    expect(stringNumberX()).toBeLessThan(markX());
    expect(markX()).toBeLessThan(fretColX(0));
  });

  it('string numbering runs 6 (low E, string 0) down to 1 (high e, string 5)', () => {
    expect(stringNumberLabel(0)).toBe(6);
    expect(stringNumberLabel(5)).toBe(1);
  });

  it('note/degree label column sits right of the fret grid', () => {
    expect(labelX()).toBeGreaterThan(fretColX(5));
    expect(labelX()).toBeLessThan(diagramWidth());
  });
});
