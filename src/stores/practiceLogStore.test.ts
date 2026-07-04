import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePracticeLogStore } from './practiceLogStore';
import { db } from '../data/db';
import { todayDateString } from '../data/practiceLogTypes';

describe('usePracticeLogStore', () => {
  beforeEach(async () => {
    await db.practiceAuto.clear();
    await db.practiceManual.clear();
    usePracticeLogStore.setState({ autoRows: [], manualRows: [], loaded: false });
  });

  it('starts empty and unloaded', () => {
    expect(usePracticeLogStore.getState().autoRows).toEqual([]);
    expect(usePracticeLogStore.getState().manualRows).toEqual([]);
    expect(usePracticeLogStore.getState().loaded).toBe(false);
  });

  it('creditAutoMinutes creates a new row for today', async () => {
    await usePracticeLogStore.getState().creditAutoMinutes('metronome', 5);
    const rows = usePracticeLogStore.getState().autoRows;
    expect(rows).toEqual([{ date: todayDateString(), feature: 'metronome', minutes: 5 }]);
  });

  it('creditAutoMinutes accumulates into the same row across calls', async () => {
    await usePracticeLogStore.getState().creditAutoMinutes('fretboard', 3);
    await usePracticeLogStore.getState().creditAutoMinutes('fretboard', 4);
    expect(usePracticeLogStore.getState().autoRows).toEqual([{ date: todayDateString(), feature: 'fretboard', minutes: 7 }]);
  });

  it('creditAutoMinutes persists to IndexedDB', async () => {
    await usePracticeLogStore.getState().creditAutoMinutes('tuner', 2);
    usePracticeLogStore.setState({ autoRows: [], manualRows: [], loaded: false });
    await usePracticeLogStore.getState().load();
    expect(usePracticeLogStore.getState().autoRows).toEqual([{ date: todayDateString(), feature: 'tuner', minutes: 2 }]);
  });

  it('creditAutoMinutes ignores non-positive deltas', async () => {
    await usePracticeLogStore.getState().creditAutoMinutes('chords', 0);
    expect(usePracticeLogStore.getState().autoRows).toEqual([]);
  });

  it('addManualEntry persists and updates in-memory state', async () => {
    const entry = await usePracticeLogStore.getState().addManualEntry({ date: '2026-07-04', memo: '基礎練習', minutes: 30, tags: ['基礎練'] });
    expect(entry.id).toBeDefined();
    expect(usePracticeLogStore.getState().manualRows).toHaveLength(1);

    usePracticeLogStore.setState({ autoRows: [], manualRows: [], loaded: false });
    await usePracticeLogStore.getState().load();
    expect(usePracticeLogStore.getState().manualRows[0].memo).toBe('基礎練習');
  });

  it('removeManualEntry deletes the entry', async () => {
    const entry = await usePracticeLogStore.getState().addManualEntry({ date: '2026-07-04', memo: 'x', minutes: 10, tags: [] });
    await usePracticeLogStore.getState().removeManualEntry(entry.id!);
    expect(usePracticeLogStore.getState().manualRows).toEqual([]);
  });

  it('clearAll wipes both tables', async () => {
    await usePracticeLogStore.getState().creditAutoMinutes('metronome', 5);
    await usePracticeLogStore.getState().addManualEntry({ date: '2026-07-04', memo: 'x', minutes: 10, tags: [] });
    await usePracticeLogStore.getState().clearAll();
    expect(usePracticeLogStore.getState().autoRows).toEqual([]);
    expect(usePracticeLogStore.getState().manualRows).toEqual([]);

    await usePracticeLogStore.getState().load();
    expect(usePracticeLogStore.getState().autoRows).toEqual([]);
    expect(usePracticeLogStore.getState().manualRows).toEqual([]);
  });
});
