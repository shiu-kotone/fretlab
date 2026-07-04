import { OPEN_CHORDS } from './openChords';
import { generateMovableVoicings } from './movableForms';
import type { Voicing } from './voicingTypes';
import { CHORD_TYPES, type ChordTypeId } from '../theory/chords';

function voicingKey(v: Voicing): string {
  return v.frets.join(',');
}

/** All voicings for a (root, type): hand-written opens (if any) first, then generated movable forms, low-to-high position, deduplicated. */
export function getVoicingsForChord(root: number, typeId: ChordTypeId): Voicing[] {
  const open = OPEN_CHORDS.filter((e) => e.root === root && e.type === typeId).map((e) => e.voicing);
  const movable = generateMovableVoicings(root, typeId);

  const seen = new Set<string>();
  const combined: Voicing[] = [];
  for (const v of [...open, ...movable]) {
    const key = voicingKey(v);
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(v);
  }
  combined.sort((a, b) => a.baseFret - b.baseFret);
  return combined;
}

/** SPEC §5.3 progression data model's `chordId`: a stable, parseable (root, type) reference. */
export function chordIdFor(root: number, typeId: ChordTypeId): string {
  return `${root}-${typeId}`;
}

export function parseChordId(chordId: string): { root: number; typeId: ChordTypeId } | null {
  const match = /^(\d{1,2})-(.+)$/.exec(chordId);
  if (!match) return null;
  const root = Number(match[1]);
  if (!Number.isInteger(root) || root < 0 || root > 11) return null;
  const typeId = match[2];
  if (!CHORD_TYPES.some((t) => t.id === typeId)) return null;
  return { root, typeId: typeId as ChordTypeId };
}

export interface TransposedChordRef {
  root: number;
  voicingIndex: number;
}

/**
 * SPEC §5.3 transpose rule: movable-form voicings "slide" as the same shape
 * (same `label`, nearest resulting position); open-position voicings can't
 * slide, so they're replaced by whichever voicing at the new root lands
 * closest to that same position. Re-derives from the existing generated
 * library rather than shifting fret numbers by hand, so this can never
 * produce an invalid voicing.
 */
export function pickTransposedVoicing(
  root: number,
  typeId: ChordTypeId,
  voicingIndex: number,
  semitones: number,
): TransposedChordRef {
  const newRoot = ((root + semitones) % 12 + 12) % 12;
  const candidates = getVoicingsForChord(newRoot, typeId);
  const current = getVoicingsForChord(root, typeId)[voicingIndex];

  if (!current || candidates.length === 0) {
    return { root: newRoot, voicingIndex: 0 };
  }

  const targetBaseFret = current.baseFret + semitones;
  const sameLabelPool = current.label === 'オープン' ? [] : candidates.filter((c) => c.label === current.label);
  const pool = sameLabelPool.length > 0 ? sameLabelPool : candidates;

  let bestIndex = 0;
  let bestDistance = Infinity;
  for (const candidate of pool) {
    const distance = Math.abs(candidate.baseFret - targetBaseFret);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = candidates.indexOf(candidate);
    }
  }

  return { root: newRoot, voicingIndex: bestIndex };
}
