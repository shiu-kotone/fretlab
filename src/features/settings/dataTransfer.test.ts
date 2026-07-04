import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { buildExportPayload, applyImportPayload, isExportPayload } from './dataTransfer';
import { db } from '../../data/db';
import { useChordLibraryStore } from '../../stores/chordLibraryStore';

describe('isExportPayload', () => {
  it('accepts a well-formed payload', () => {
    expect(
      isExportPayload({ version: 1, exportedAt: 0, customTunings: [], progressions: [], favorites: [], practiceAuto: [], practiceManual: [] }),
    ).toBe(true);
  });

  it('rejects malformed or unversioned data', () => {
    expect(isExportPayload(null)).toBe(false);
    expect(isExportPayload({})).toBe(false);
    expect(isExportPayload({ version: 2, customTunings: [] })).toBe(false);
  });
});

describe('buildExportPayload / applyImportPayload round-trip', () => {
  beforeEach(async () => {
    await db.customTunings.clear();
    await db.progressions.clear();
    await db.practiceAuto.clear();
    await db.practiceManual.clear();
    useChordLibraryStore.setState({ favorites: [] });
  });

  it('exports current data and restores it after clearing everything', async () => {
    await db.customTunings.add({ name: 'マイチューニング', tuning: [38, 45, 50, 55, 59, 62], createdAt: 1 });
    await db.practiceAuto.put({ date: '2026-07-04', feature: 'metronome', minutes: 12 });
    await db.practiceManual.add({ date: '2026-07-04', memo: '基礎練', minutes: 20, tags: ['基礎練'], createdAt: 1 });
    useChordLibraryStore.getState().toggleFavorite(0, 'maj', 0);

    const exported = await buildExportPayload();
    expect(exported.customTunings).toHaveLength(1);
    expect(exported.favorites).toHaveLength(1);

    // Wipe everything, then restore from the exported payload.
    await db.customTunings.clear();
    await db.practiceAuto.clear();
    await db.practiceManual.clear();
    useChordLibraryStore.setState({ favorites: [] });

    await applyImportPayload(exported);

    const tunings = await db.customTunings.toArray();
    expect(tunings).toHaveLength(1);
    expect(tunings[0].name).toBe('マイチューニング');

    const autoRows = await db.practiceAuto.toArray();
    expect(autoRows).toEqual([{ date: '2026-07-04', feature: 'metronome', minutes: 12 }]);

    const manualRows = await db.practiceManual.toArray();
    expect(manualRows).toHaveLength(1);
    expect(manualRows[0].memo).toBe('基礎練');

    expect(useChordLibraryStore.getState().favorites).toEqual(exported.favorites);
  });

  it('import replaces rather than merges existing data', async () => {
    await db.customTunings.add({ name: '既存', tuning: [40, 45, 50, 55, 59, 64], createdAt: 1 });
    await applyImportPayload({ version: 1, exportedAt: 0, customTunings: [{ name: '新規', tuning: [40, 45, 50, 55, 59, 64] }], progressions: [], favorites: [], practiceAuto: [], practiceManual: [] });

    const tunings = await db.customTunings.toArray();
    expect(tunings).toHaveLength(1);
    expect(tunings[0].name).toBe('新規');
  });
});
