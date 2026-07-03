import { create } from 'zustand';
import { db, type CustomTuningRecord } from '../data/db';
import type { Midi } from '../theory/pitch';

export interface CustomTuningItem {
  id: string;
  name: string;
  tuning: Midi[];
}

function toItem(record: CustomTuningRecord): CustomTuningItem {
  return { id: `custom:${record.id}`, name: record.name, tuning: record.tuning };
}

function numericId(id: string): number {
  return Number(id.replace('custom:', ''));
}

interface CustomTuningsState {
  items: CustomTuningItem[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (name: string, tuning: Midi[]) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

/**
 * SPEC §2.2/§4.2: custom tunings are user-created data persisted to
 * IndexedDB via Dexie (unlike settings, which live in localStorage).
 */
export const useCustomTuningsStore = create<CustomTuningsState>((set) => ({
  items: [],
  loaded: false,

  load: async () => {
    const records = await db.customTunings.orderBy('createdAt').toArray();
    set({ items: records.map(toItem), loaded: true });
  },

  add: async (name, tuning) => {
    const id = await db.customTunings.add({ name, tuning, createdAt: Date.now() });
    const item = toItem({ id, name, tuning, createdAt: Date.now() });
    set((s) => ({ items: [...s.items, item] }));
    return item.id;
  },

  remove: async (id) => {
    await db.customTunings.delete(numericId(id));
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
}));
