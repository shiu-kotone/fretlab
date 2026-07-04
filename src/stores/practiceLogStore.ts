import { create } from 'zustand';
import { db } from '../data/db';
import { todayDateString, type AutoPracticeRow, type ManualPracticeRow, type PracticeFeature } from '../data/practiceLogTypes';

interface PracticeLogState {
  autoRows: AutoPracticeRow[];
  manualRows: ManualPracticeRow[];
  loaded: boolean;
  load: () => Promise<void>;
  creditAutoMinutes: (feature: PracticeFeature, minutes: number) => Promise<void>;
  addManualEntry: (entry: { date: string; memo: string; minutes: number; tags: string[] }) => Promise<ManualPracticeRow>;
  removeManualEntry: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

/**
 * SPEC §5.7: automatic (per date+feature, incremented in place) and manual
 * (freeform) practice log entries, persisted to IndexedDB via Dexie. The
 * full history is kept in memory — at realistic personal-use volumes (a
 * handful of rows per day) this is trivially small, and statistics are
 * computed by the pure functions in data/practiceLogTypes.ts over whatever
 * date range the UI needs.
 */
export const usePracticeLogStore = create<PracticeLogState>((set) => ({
  autoRows: [],
  manualRows: [],
  loaded: false,

  load: async () => {
    const [autoRows, manualRows] = await Promise.all([db.practiceAuto.toArray(), db.practiceManual.toArray()]);
    set({ autoRows, manualRows, loaded: true });
  },

  creditAutoMinutes: async (feature, minutes) => {
    if (minutes <= 0) return;
    const date = todayDateString();
    const existing = await db.practiceAuto.get([date, feature]);
    const total = (existing?.minutes ?? 0) + minutes;
    await db.practiceAuto.put({ date, feature, minutes: total });
    set((s) => {
      const idx = s.autoRows.findIndex((r) => r.date === date && r.feature === feature);
      if (idx >= 0) {
        const next = [...s.autoRows];
        next[idx] = { date, feature, minutes: total };
        return { autoRows: next };
      }
      return { autoRows: [...s.autoRows, { date, feature, minutes: total }] };
    });
  },

  addManualEntry: async (entry) => {
    const record: ManualPracticeRow = { ...entry, createdAt: Date.now() };
    const id = await db.practiceManual.add(record);
    const withId = { ...record, id };
    set((s) => ({ manualRows: [...s.manualRows, withId] }));
    return withId;
  },

  removeManualEntry: async (id) => {
    await db.practiceManual.delete(id);
    set((s) => ({ manualRows: s.manualRows.filter((r) => r.id !== id) }));
  },

  clearAll: async () => {
    await Promise.all([db.practiceAuto.clear(), db.practiceManual.clear()]);
    set({ autoRows: [], manualRows: [] });
  },
}));
