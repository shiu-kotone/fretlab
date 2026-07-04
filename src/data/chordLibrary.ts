import { OPEN_CHORDS } from './openChords';
import { generateMovableVoicings } from './movableForms';
import type { Voicing } from './voicingTypes';
import type { ChordTypeId } from '../theory/chords';

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
