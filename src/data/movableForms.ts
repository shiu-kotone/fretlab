import { REGULAR_TUNING } from '../theory/pitch';
import { chordTones, findChordType, type ChordTypeId } from '../theory/chords';
import type { Voicing } from './voicingTypes';

/**
 * SPEC §5.2 "ムーバブルフォームはテンプレート生成" — declared interpretation:
 * rather than hand-authoring CAGED-shape templates per chord type (30 types
 * x several shapes, a large and error-prone manual effort), voicings are
 * generated algorithmically: pick a barre fret where a chosen "root string"
 * sounds the root, then for every other string search a small nearby fret
 * window for *any* note that's a valid chord tone (muting the string if
 * none is found). Every chosen fret is verified against chordTones() at
 * generation time, so correctness is guaranteed by construction rather than
 * by hand-checking dozens of templates — and it covers all 12 roots x all
 * 30 chord types uniformly, which a fixed template set could not without
 * per-type authoring.
 */

const SEARCH_WINDOW = 4;
const MAX_FRET_SEARCH = 15;

function pitchClassAt(stringIndex: number, fret: number): number {
  return ((REGULAR_TUNING[stringIndex] + fret) % 12 + 12) % 12;
}

/** Lowest fret (within 0-MAX_FRET_SEARCH) on `stringIndex` closest to `near` that sounds `targetPc`. */
function findFretForPitchClass(stringIndex: number, targetPc: number, near: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let f = 0; f <= MAX_FRET_SEARCH; f++) {
    if (pitchClassAt(stringIndex, f) === targetPc) {
      const dist = Math.abs(f - near);
      if (dist < bestDist) {
        bestDist = dist;
        best = f;
      }
    }
  }
  return best;
}

function toBaseFret(lowestSoundingFret: number): number {
  return lowestSoundingFret <= 0 ? 1 : lowestSoundingFret;
}

/** 6th-string-root ("E型") or 5th-string-root ("A型") barre-style voicing. */
function generateBarreVoicing(root: number, typeId: ChordTypeId, rootStringIndex: 0 | 1): Voicing | null {
  const tones = chordTones(root, typeId);
  const barreFret = ((root - REGULAR_TUNING[rootStringIndex]) % 12 + 12) % 12;

  const frets: (number | 'x')[] = new Array(6).fill('x');
  frets[rootStringIndex] = barreFret;

  for (let s = 0; s < 6; s++) {
    if (s === rootStringIndex) continue;
    let chosen: number | null = null;
    let chosenDist = Infinity;
    for (let f = Math.max(0, barreFret - 1); f <= barreFret + SEARCH_WINDOW; f++) {
      if (tones.has(pitchClassAt(s, f))) {
        const dist = Math.abs(f - barreFret);
        if (dist < chosenDist) {
          chosenDist = dist;
          chosen = f;
        }
      }
    }
    frets[s] = chosen ?? 'x';
  }

  const soundingCount = frets.filter((f) => f !== 'x').length;
  if (soundingCount < 3) return null;

  return { frets, baseFret: toBaseFret(barreFret), label: rootStringIndex === 0 ? 'E型' : 'A型' };
}

/** Classic root-7th-3rd shell voicing, root fixed on the 6th or 5th string. */
function generateShellVoicing(root: number, typeId: ChordTypeId, rootStringIndex: 0 | 1): Voicing | null {
  const def = findChordType(typeId);
  const thirdInterval = [4, 3].find((iv) => def.intervals.includes(iv));
  const seventhInterval = [10, 11, 9].find((iv) => def.intervals.includes(iv));
  if (thirdInterval === undefined || seventhInterval === undefined) return null;

  const barreFret = ((root - REGULAR_TUNING[rootStringIndex]) % 12 + 12) % 12;
  const thirdPc = (root + thirdInterval) % 12;
  const seventhPc = (root + seventhInterval) % 12;

  const frets: (number | 'x')[] = new Array(6).fill('x');
  frets[rootStringIndex] = barreFret;

  const [seventhString, thirdString] = rootStringIndex === 0 ? [2, 3] : [3, 4];
  frets[seventhString] = findFretForPitchClass(seventhString, seventhPc, barreFret);
  frets[thirdString] = findFretForPitchClass(thirdString, thirdPc, barreFret);

  return { frets, baseFret: toBaseFret(barreFret), label: 'シェル' };
}

/** 3-adjacent-string triad voicing (SPEC §5.2 "1-3弦/2-4弦/3-5弦"; string 1 = high e = index 5). */
function generateTriadVoicing(root: number, typeId: ChordTypeId, stringIndices: [number, number, number]): Voicing | null {
  const tones = chordTones(root, typeId);

  for (let base = 0; base <= 11; base++) {
    const frets: (number | 'x')[] = new Array(6).fill('x');
    let ok = true;
    for (const s of stringIndices) {
      let chosen: number | null = null;
      for (let f = base; f <= base + 3; f++) {
        if (tones.has(pitchClassAt(s, f))) {
          chosen = f;
          break;
        }
      }
      if (chosen === null) {
        ok = false;
        break;
      }
      frets[s] = chosen;
    }
    if (!ok) continue;

    const hasRoot = stringIndices.some((s) => frets[s] !== 'x' && pitchClassAt(s, frets[s] as number) === root);
    if (!hasRoot) continue;

    const lowestFret = Math.min(...stringIndices.map((s) => frets[s] as number));
    return { frets, baseFret: toBaseFret(lowestFret), label: 'トライアド' };
  }
  return null;
}

function voicingKey(v: Voicing): string {
  return v.frets.join(',');
}

/** All algorithmically-generated movable voicings for a (root, type), deduplicated and sorted by position. */
export function generateMovableVoicings(root: number, typeId: ChordTypeId): Voicing[] {
  const candidates = [
    generateBarreVoicing(root, typeId, 0),
    generateBarreVoicing(root, typeId, 1),
    generateShellVoicing(root, typeId, 0),
    generateShellVoicing(root, typeId, 1),
    generateTriadVoicing(root, typeId, [3, 4, 5]), // 1-3弦
    generateTriadVoicing(root, typeId, [2, 3, 4]), // 2-4弦
    generateTriadVoicing(root, typeId, [1, 2, 3]), // 3-5弦
  ].filter((v): v is Voicing => v !== null);

  const seen = new Set<string>();
  const deduped = candidates.filter((v) => {
    const key = voicingKey(v);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => a.baseFret - b.baseFret);
  return deduped;
}
