import type { Midi } from './pitch';

export interface PositionBox {
  index: number; // 1-5
  startFret: number;
  endFret: number;
}

const BOX_WIDTH = 4;
/**
 * Simplified position-box scheme (SPEC §5.1 "ボックス1〜5(ペンタ・CAGED準拠の5
 * ポジション)"): reproducing textbook CAGED shapes exactly for all 20 scale
 * types is out of scope for this phase. Instead, 5 windows are anchored to
 * the root's fret on the low (6th) string, spaced at these semitone offsets
 * — chosen to approximate the E-D-C-A-G shape spacing pattern — giving a
 * practical "show me a playable few-fret chunk of this scale" tool rather
 * than pedagogically exact CAGED boundaries.
 */
const BOX_OFFSETS = [0, 2, 5, 7, 9];

/** Computes the 5 position-box fret ranges for a scale rooted at `rootPc`, given the current tuning. */
export function computePositionBoxes(rootPc: number, tuning: Midi[]): PositionBox[] {
  const lowOpenPc = ((tuning[0] % 12) + 12) % 12;
  const firstRootFret = (((rootPc - lowOpenPc) % 12) + 12) % 12;

  return BOX_OFFSETS.map((offset, i) => {
    const startFret = Math.max(0, firstRootFret + offset - 1);
    const endFret = Math.min(22, startFret + BOX_WIDTH);
    return { index: i + 1, startFret, endFret };
  });
}

export function isFretInBox(fret: number, box: PositionBox): boolean {
  return fret >= box.startFret && fret <= box.endFret;
}
