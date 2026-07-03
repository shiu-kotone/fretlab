import type { StringOrientation } from '../../stores/fretboardStore';

/**
 * SVG logical (viewBox) units. The <svg> scales responsively via CSS to
 * whatever the container's physical width is (typically ~350-400px on a
 * phone) — with VIEW_WIDTH=1000 that's roughly a 0.35-0.4x scale-down, so
 * dot/text sizes here are deliberately large (a "readable 10px" on screen
 * needs a logical size of ~25-30 units).
 */
export const VIEW_WIDTH = 1000;
export const OPEN_ZONE_WIDTH = 70;
export const STRING_SPACING = 64;
export const TOP_MARGIN = 50;
/** Extra room below the last string for position-dot markers and fret numbers. */
export const BOTTOM_MARGIN = 90;
export const STRING_COUNT = 6;

export function fretAreaWidth(): number {
  return VIEW_WIDTH - OPEN_ZONE_WIDTH;
}

export function fretWidth(zoomFrets: number): number {
  return fretAreaWidth() / zoomFrets;
}

/** x of the fret wire at the right edge of fret `fret`'s playable zone (fret 0 = the nut). */
export function fretBoundaryX(fret: number, zoomFrets: number): number {
  return OPEN_ZONE_WIDTH + fret * fretWidth(zoomFrets);
}

export function fretCenterX(fret: number, zoomFrets: number): number {
  if (fret <= 0) return OPEN_ZONE_WIDTH / 2;
  return fretBoundaryX(fret - 1, zoomFrets) + fretWidth(zoomFrets) / 2;
}

/** 0 = top row, regardless of tuning index; depends on display orientation. */
export function stringVisualRow(tuningIndex: number, orientation: StringOrientation): number {
  return orientation === '1-top' ? STRING_COUNT - 1 - tuningIndex : tuningIndex;
}

export function stringY(tuningIndex: number, orientation: StringOrientation): number {
  return TOP_MARGIN + stringVisualRow(tuningIndex, orientation) * STRING_SPACING;
}

export function boardHeight(): number {
  return TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING + BOTTOM_MARGIN;
}

export interface FretPosition {
  tuningIndex: number;
  fret: number;
}

/**
 * Maps a point in the fretboard's (un-mirrored) logical coordinate space to a
 * (string, fret) cell, or null if outside the playable area. Left-handed
 * mirroring is handled by the caller inverting `x` before calling this — SPEC
 * §4.1 requires the coordinate transform to live in one place at render/input
 * time, never touching the underlying data.
 */
export function pointToFretPosition(
  x: number,
  y: number,
  zoomFrets: number,
  orientation: StringOrientation,
): FretPosition | null {
  if (x < 0 || x > VIEW_WIDTH) return null;
  const row = Math.round((y - TOP_MARGIN) / STRING_SPACING);
  if (row < 0 || row > STRING_COUNT - 1) return null;

  const tuningIndex = orientation === '1-top' ? STRING_COUNT - 1 - row : row;

  let fret: number;
  if (x < OPEN_ZONE_WIDTH) {
    fret = 0;
  } else {
    fret = Math.ceil((x - OPEN_ZONE_WIDTH) / fretWidth(zoomFrets));
    fret = Math.max(1, Math.min(zoomFrets, fret));
  }
  return { tuningIndex, fret };
}
