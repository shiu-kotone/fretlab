import { db } from '../../data/db';
import { useChordLibraryStore, type FavoriteChord } from '../../stores/chordLibraryStore';
import type { AutoPracticeRow, ManualPracticeRow } from '../../data/practiceLogTypes';
import type { Progression } from '../../data/progressionTypes';

/** SPEC §4.7 export scope: practice log, custom tunings, user progressions, favorites — recordings are excluded (shared individually instead). */
export interface ExportPayload {
  version: 1;
  exportedAt: number;
  customTunings: { name: string; tuning: number[] }[];
  progressions: Progression[];
  favorites: FavoriteChord[];
  practiceAuto: AutoPracticeRow[];
  practiceManual: Omit<ManualPracticeRow, 'id'>[];
}

export async function buildExportPayload(): Promise<ExportPayload> {
  const [customTunings, progressions, practiceAuto, practiceManualRaw] = await Promise.all([
    db.customTunings.toArray(),
    db.progressions.toArray(),
    db.practiceAuto.toArray(),
    db.practiceManual.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    customTunings: customTunings.map((t) => ({ name: t.name, tuning: t.tuning })),
    progressions,
    favorites: useChordLibraryStore.getState().favorites,
    practiceAuto,
    practiceManual: practiceManualRaw.map(({ id: _id, ...rest }) => rest),
  };
}

export function isExportPayload(data: unknown): data is ExportPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    Array.isArray(d.customTunings) &&
    Array.isArray(d.progressions) &&
    Array.isArray(d.favorites) &&
    Array.isArray(d.practiceAuto) &&
    Array.isArray(d.practiceManual)
  );
}

/**
 * SPEC §4.7 import: declared as replace semantics (not merge) — each covered
 * table is wiped and repopulated from the file, since merge would require an
 * arbitrary ID-collision policy the spec doesn't define.
 */
export async function applyImportPayload(data: ExportPayload): Promise<void> {
  await db.customTunings.clear();
  if (data.customTunings.length > 0) {
    await db.customTunings.bulkAdd(data.customTunings.map((t) => ({ name: t.name, tuning: t.tuning, createdAt: Date.now() })));
  }

  await db.progressions.clear();
  if (data.progressions.length > 0) await db.progressions.bulkAdd(data.progressions);

  await db.practiceAuto.clear();
  if (data.practiceAuto.length > 0) await db.practiceAuto.bulkAdd(data.practiceAuto);

  await db.practiceManual.clear();
  if (data.practiceManual.length > 0) await db.practiceManual.bulkAdd(data.practiceManual);

  useChordLibraryStore.setState({ favorites: data.favorites });
}
