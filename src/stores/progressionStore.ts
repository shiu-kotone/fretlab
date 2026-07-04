import { create } from 'zustand';
import { db } from '../data/db';
import type { Progression } from '../data/progressionTypes';
import { createEmptyProgression } from '../data/progressionTypes';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface ProgressionStoreState {
  items: Progression[];
  loaded: boolean;
  load: () => Promise<void>;
  create: (name: string) => Promise<Progression>;
  duplicate: (source: Progression, name?: string) => Promise<Progression>;
  update: (progression: Progression) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * SPEC §5.3: user-created progressions persist to IndexedDB via Dexie
 * (bundled presets are static data in data/presetProgressions.ts and never
 * written here — editing one duplicates it into a user progression first).
 */
export const useProgressionStore = create<ProgressionStoreState>((set) => ({
  items: [],
  loaded: false,

  load: async () => {
    const records = await db.progressions.orderBy('updatedAt').reverse().toArray();
    set({ items: records, loaded: true });
  },

  create: async (name) => {
    const progression: Progression = { ...createEmptyProgression(name), id: newId() };
    await db.progressions.put(progression);
    set((s) => ({ items: [progression, ...s.items] }));
    return progression;
  },

  duplicate: async (source, name) => {
    const now = Date.now();
    const copy: Progression = {
      ...source,
      id: newId(),
      name: name ?? `${source.name} のコピー`,
      createdAt: now,
      updatedAt: now,
    };
    await db.progressions.put(copy);
    set((s) => ({ items: [copy, ...s.items] }));
    return copy;
  },

  update: async (progression) => {
    const updated: Progression = { ...progression, updatedAt: Date.now() };
    await db.progressions.put(updated);
    set((s) => ({ items: s.items.map((p) => (p.id === updated.id ? updated : p)) }));
  },

  remove: async (id) => {
    await db.progressions.delete(id);
    set((s) => ({ items: s.items.filter((p) => p.id !== id) }));
  },
}));
