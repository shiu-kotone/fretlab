/**
 * SPEC §5.2 voicing shape, 6th string → 1st string order (index 0 = low E /
 * 6th string ... index 5 = high e / 1st string), matching the theory
 * layer's REGULAR_TUNING index convention.
 */
export interface Voicing {
  frets: (number | 'x')[];
  fingers?: (0 | 1 | 2 | 3 | 4)[];
  /** fromString/toString use the same 0-5 string index as `frets`. */
  barres?: { fret: number; fromString: number; toString: number }[];
  /** Diagram left edge; 1 = open position (nut visible). */
  baseFret: number;
  label: 'オープン' | 'E型' | 'A型' | 'C型' | 'G型' | 'D型' | 'トライアド' | 'シェル';
}
