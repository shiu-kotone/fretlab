import { describe, it, expect } from 'vitest';
import { computePositionBoxes, isFretInBox } from './positionBoxes';
import { REGULAR_TUNING } from './pitch';

describe('computePositionBoxes', () => {
  it('always returns exactly 5 boxes, numbered 1-5', () => {
    const boxes = computePositionBoxes(0, REGULAR_TUNING);
    expect(boxes).toHaveLength(5);
    expect(boxes.map((b) => b.index)).toEqual([1, 2, 3, 4, 5]);
  });

  it('every box stays within the playable 0-22 fret range', () => {
    for (let root = 0; root < 12; root++) {
      const boxes = computePositionBoxes(root, REGULAR_TUNING);
      for (const box of boxes) {
        expect(box.startFret).toBeGreaterThanOrEqual(0);
        expect(box.endFret).toBeLessThanOrEqual(22);
        expect(box.endFret).toBeGreaterThan(box.startFret);
      }
    }
  });

  it('boxes are ordered by ascending start fret', () => {
    const boxes = computePositionBoxes(4, REGULAR_TUNING);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].startFret).toBeGreaterThanOrEqual(boxes[i - 1].startFret);
    }
  });

  it('shifts with a different root', () => {
    const boxesC = computePositionBoxes(0, REGULAR_TUNING); // C, low E open string is E(4)
    const boxesG = computePositionBoxes(7, REGULAR_TUNING); // G
    expect(boxesC[0].startFret).not.toBe(boxesG[0].startFret);
  });

  it('respects a non-regular tuning (Drop D)', () => {
    const dropD = [38, 45, 50, 55, 59, 64]; // low string is D2 instead of E2
    const boxesRegular = computePositionBoxes(0, REGULAR_TUNING);
    const boxesDropD = computePositionBoxes(0, dropD);
    expect(boxesDropD[0].startFret).not.toBe(boxesRegular[0].startFret);
  });
});

describe('isFretInBox', () => {
  it('is true within the inclusive [startFret, endFret] range', () => {
    const box = { index: 1, startFret: 3, endFret: 7 };
    expect(isFretInBox(3, box)).toBe(true);
    expect(isFretInBox(7, box)).toBe(true);
    expect(isFretInBox(5, box)).toBe(true);
  });

  it('is false outside the range', () => {
    const box = { index: 1, startFret: 3, endFret: 7 };
    expect(isFretInBox(2, box)).toBe(false);
    expect(isFretInBox(8, box)).toBe(false);
  });
});
