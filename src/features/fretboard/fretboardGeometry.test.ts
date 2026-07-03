import { describe, it, expect } from 'vitest';
import {
  fretBoundaryX,
  fretCenterX,
  stringVisualRow,
  stringY,
  pointToFretPosition,
  VIEW_WIDTH,
  OPEN_ZONE_WIDTH,
  TOP_MARGIN,
  STRING_SPACING,
} from './fretboardGeometry';

describe('fretBoundaryX / fretCenterX', () => {
  it('fret 0 boundary is exactly the nut position', () => {
    expect(fretBoundaryX(0, 12)).toBe(OPEN_ZONE_WIDTH);
  });

  it('the open-string zone center is before the nut', () => {
    expect(fretCenterX(0, 12)).toBeLessThan(OPEN_ZONE_WIDTH);
    expect(fretCenterX(0, 12)).toBeGreaterThan(0);
  });

  it('fret centers increase monotonically', () => {
    for (let f = 2; f <= 12; f++) {
      expect(fretCenterX(f, 12)).toBeGreaterThan(fretCenterX(f - 1, 12));
    }
  });

  it('the last fret boundary reaches the full view width, at every zoom level', () => {
    expect(fretBoundaryX(12, 12)).toBeCloseTo(VIEW_WIDTH, 6);
    expect(fretBoundaryX(15, 15)).toBeCloseTo(VIEW_WIDTH, 6);
    expect(fretBoundaryX(22, 22)).toBeCloseTo(VIEW_WIDTH, 6);
  });

  it('follows the 12th-root-of-2 scale-length formula: fret widths shrink going up the neck (realistic spacing, not even)', () => {
    const widthOf = (f: number, zoom: number) => fretBoundaryX(f, zoom) - fretBoundaryX(f - 1, zoom);
    const firstFretWidth = widthOf(1, 22);
    const lastFretWidth = widthOf(22, 22);
    expect(lastFretWidth).toBeLessThan(firstFretWidth);
    // consecutive fret widths should shrink monotonically up the neck
    for (let f = 2; f <= 22; f++) {
      expect(widthOf(f, 22)).toBeLessThanOrEqual(widthOf(f - 1, 22));
    }
  });

  it('fret 12 (an octave) lands past the halfway point of the visible board at 12F zoom', () => {
    // real guitars: fret 12 is the halfway point of the *full open-to-bridge*
    // scale length, but since only 12 frets are shown here (nothing beyond
    // the octave), it should still land in the second half of the fret area.
    const midpoint = (OPEN_ZONE_WIDTH + VIEW_WIDTH) / 2;
    expect(fretBoundaryX(12, 12)).toBeGreaterThan(midpoint);
  });
});

describe('stringVisualRow / stringY', () => {
  it('1-top orientation puts tuning index 5 (high e) at row 0', () => {
    expect(stringVisualRow(5, '1-top')).toBe(0);
    expect(stringVisualRow(0, '1-top')).toBe(5);
  });

  it('6-top orientation puts tuning index 0 (low E) at row 0', () => {
    expect(stringVisualRow(0, '6-top')).toBe(0);
    expect(stringVisualRow(5, '6-top')).toBe(5);
  });

  it('stringY increases with row', () => {
    expect(stringY(5, '1-top')).toBe(TOP_MARGIN);
    expect(stringY(0, '1-top')).toBe(TOP_MARGIN + 5 * STRING_SPACING);
  });
});

describe('pointToFretPosition', () => {
  it('resolves a tap in the open-string zone to fret 0', () => {
    const pos = pointToFretPosition(OPEN_ZONE_WIDTH / 2, TOP_MARGIN, 12, '1-top');
    expect(pos?.fret).toBe(0);
  });

  it('resolves a tap just past the nut to fret 1', () => {
    const pos = pointToFretPosition(OPEN_ZONE_WIDTH + 1, TOP_MARGIN, 12, '1-top');
    expect(pos?.fret).toBe(1);
  });

  it('resolves a tap at the last visible fret correctly', () => {
    const pos = pointToFretPosition(VIEW_WIDTH - 1, TOP_MARGIN, 12, '1-top');
    expect(pos?.fret).toBe(12);
  });

  it('maps the top row to tuning index 5 in 1-top orientation', () => {
    const pos = pointToFretPosition(OPEN_ZONE_WIDTH + 1, TOP_MARGIN, 12, '1-top');
    expect(pos?.tuningIndex).toBe(5);
  });

  it('maps the top row to tuning index 0 in 6-top orientation', () => {
    const pos = pointToFretPosition(OPEN_ZONE_WIDTH + 1, TOP_MARGIN, 12, '6-top');
    expect(pos?.tuningIndex).toBe(0);
  });

  it('returns null for a point above or below the string rows', () => {
    expect(pointToFretPosition(100, -100, 12, '1-top')).toBeNull();
    expect(pointToFretPosition(100, 10000, 12, '1-top')).toBeNull();
  });

  it('returns null for a point outside the horizontal view bounds', () => {
    expect(pointToFretPosition(-10, TOP_MARGIN, 12, '1-top')).toBeNull();
    expect(pointToFretPosition(VIEW_WIDTH + 10, TOP_MARGIN, 12, '1-top')).toBeNull();
  });

  it('clamps fret to zoomFrets even for a point exactly on the boundary', () => {
    const pos = pointToFretPosition(VIEW_WIDTH, TOP_MARGIN, 12, '1-top');
    expect(pos?.fret).toBe(12);
  });
});
