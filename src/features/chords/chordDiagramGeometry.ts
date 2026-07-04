export const DIAGRAM_WIDTH = 300;
export const STRING_COUNT = 6;
export const STRING_MARGIN = 34;
export const FRET_COUNT_SHOWN = 5;
export const FRET_HEIGHT = 54;
export const TOP_LABEL_HEIGHT = 44;
export const BOTTOM_LABEL_HEIGHT = 64;

/** stringIndex 0 = 6th/low E (leftmost) ... 5 = 1st/high e (rightmost) — the standard chord-diagram convention. */
export function stringX(stringIndex: number): number {
  const span = DIAGRAM_WIDTH - 2 * STRING_MARGIN;
  return STRING_MARGIN + (stringIndex / (STRING_COUNT - 1)) * span;
}

/** fretRow 0 = the nut/top line, increasing downward. */
export function fretRowY(fretRow: number): number {
  return TOP_LABEL_HEIGHT + fretRow * FRET_HEIGHT;
}

export function diagramHeight(): number {
  return TOP_LABEL_HEIGHT + FRET_COUNT_SHOWN * FRET_HEIGHT + BOTTOM_LABEL_HEIGHT;
}

/** Maps an absolute fret (relative to `baseFret`) to a 1-based grid row, or null if out of the visible range. */
export function fretToRow(fret: number, baseFret: number): number | null {
  const row = fret - baseFret + 1;
  if (row < 1 || row > FRET_COUNT_SHOWN) return null;
  return row;
}

export function dotY(row: number): number {
  return fretRowY(row - 1) + FRET_HEIGHT / 2;
}
