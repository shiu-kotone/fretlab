import { parseChordId } from '../../data/chordLibrary';
import { findChordType } from '../../theory/chords';
import { noteName } from '../../theory/pitch';
import type { NoteNamingPreference } from '../../stores/settingsStore';

export function chordIdLabel(chordId: string, noteNaming: NoteNamingPreference): string {
  const parsed = parseChordId(chordId);
  if (!parsed) return '?';
  const def = findChordType(parsed.typeId);
  const root = noteName(60 + parsed.root, noteNaming).replace(/\d+$/, '');
  return `${root}${def.symbol || 'maj'}`;
}
