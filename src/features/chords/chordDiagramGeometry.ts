export const STRING_COUNT = 6;
export const FRET_COUNT_SHOWN = 5;
export const STRING_SPACING = 46;
export const FRET_WIDTH = 56;
export const TOP_MARGIN = 34;
export const BOTTOM_MARGIN = 14;
/** Column for the string-number labels (1-6), outermost on the nut side. */
export const STRING_NUM_COLUMN_WIDTH = 22;
/** Column for the open/mute (o/x) marks, between the string numbers and the nut. */
export const MARK_COLUMN_WIDTH = 30;
/** Column for the note name + degree labels, past the last fret shown. */
export const LABEL_COLUMN_WIDTH = 64;

export const LEFT_MARGIN = STRING_NUM_COLUMN_WIDTH + MARK_COLUMN_WIDTH;
export const GRID_WIDTH = FRET_COUNT_SHOWN * FRET_WIDTH;

export function diagramWidth(): number {
  return LEFT_MARGIN + GRID_WIDTH + LABEL_COLUMN_WIDTH;
}

export function diagramHeight(): number {
  return TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING + BOTTOM_MARGIN;
}

/**
 * Horizontal neck orientation (nut on the left, frets increasing rightward):
 * stringIndex 0 = 6th/low E (bottom row) ... 5 = 1st/high e (top row). This is
 * the conventional vertical chord chart (low E on the left) rotated 90°
 * counter-clockwise, matching the fretboard feature's default '1-top' layout.
 */
export function stringRow(stringIndex: number): number {
  return STRING_COUNT - 1 - stringIndex;
}

export function stringY(stringIndex: number): number {
  return TOP_MARGIN + stringRow(stringIndex) * STRING_SPACING;
}

export function gridTopY(): number {
  return TOP_MARGIN;
}

export function gridBottomY(): number {
  return TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING;
}

/** fretCol 0 = nut / left edge of the visible window, increasing rightward. */
export function fretColX(fretCol: number): number {
  return LEFT_MARGIN + fretCol * FRET_WIDTH;
}

/** Maps an absolute fret (relative to `baseFret`) to a 1-based grid column, or null if out of the visible range. */
export function fretToCol(fret: number, baseFret: number): number | null {
  const col = fret - baseFret + 1;
  if (col < 1 || col > FRET_COUNT_SHOWN) return null;
  return col;
}

export function dotX(col: number): number {
  return fretColX(col - 1) + FRET_WIDTH / 2;
}

export function stringNumberX(): number {
  return STRING_NUM_COLUMN_WIDTH / 2;
}

/** Conventional 1 (high e) - 6 (low E) string numbering. */
export function stringNumberLabel(stringIndex: number): number {
  return STRING_COUNT - stringIndex;
}

export function markX(): number {
  return STRING_NUM_COLUMN_WIDTH + MARK_COLUMN_WIDTH / 2;
}

export function labelX(): number {
  return LEFT_MARGIN + GRID_WIDTH + LABEL_COLUMN_WIDTH / 2;
}
