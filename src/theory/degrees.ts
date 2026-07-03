/** SPEC §5.1: the 12 chromatic degree labels, indexed by semitone offset from root (0-11). */
export const DEGREE_LABELS = [
  'R',
  '♭2',
  '2',
  '♭3',
  '3',
  '4',
  '♭5',
  '5',
  '♯5',
  '6',
  '♭7',
  '7',
] as const;

export function degreeLabel(semitone: number): string {
  const i = ((semitone % 12) + 12) % 12;
  return DEGREE_LABELS[i];
}

export type DegreeColorRole = 'root' | 'third' | 'fifth' | 'seventh' | 'tension';

/** SPEC §4.6 degree color mapping, shared by fretboard and chord diagrams. */
const DEGREE_COLOR_ROLE: Record<number, DegreeColorRole> = {
  0: 'root',
  1: 'tension',
  2: 'tension',
  3: 'third',
  4: 'third',
  5: 'tension',
  6: 'tension',
  7: 'fifth',
  8: 'tension',
  9: 'tension',
  10: 'seventh',
  11: 'seventh',
};

const DEGREE_COLOR_VAR: Record<DegreeColorRole, string> = {
  root: 'var(--degree-root)',
  third: 'var(--degree-third)',
  fifth: 'var(--degree-fifth)',
  seventh: 'var(--degree-seventh)',
  tension: 'var(--degree-tension)',
};

export function degreeColorRole(semitone: number): DegreeColorRole {
  const i = ((semitone % 12) + 12) % 12;
  return DEGREE_COLOR_ROLE[i];
}

export function degreeColor(semitone: number): string {
  return DEGREE_COLOR_VAR[degreeColorRole(semitone)];
}

export interface DegreePreset {
  id: string;
  label: string;
  degrees: number[];
}

/** SPEC §5.1 degree-highlight preset chips. */
export const DEGREE_PRESETS: DegreePreset[] = [
  { id: 'major-triad', label: 'メジャートライアド', degrees: [0, 4, 7] },
  { id: 'minor-triad', label: 'マイナートライアド', degrees: [0, 3, 7] },
  { id: '7th', label: '7th', degrees: [0, 4, 7, 10] },
  { id: 'maj7', label: 'maj7', degrees: [0, 4, 7, 11] },
  { id: 'm7', label: 'm7', degrees: [0, 3, 7, 10] },
  { id: 'power-chord', label: 'パワーコード', degrees: [0, 7] },
];
