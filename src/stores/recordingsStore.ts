import { create } from 'zustand';
import { db, type RecordingRecord } from '../data/db';

/** List metadata only — the Blob is fetched on demand via getBlob() to avoid holding potentially large audio in memory. */
export type RecordingMeta = Omit<RecordingRecord, 'blob'> & { id: number };

function toMeta(record: RecordingRecord): RecordingMeta {
  const { blob: _blob, ...meta } = record;
  return meta as RecordingMeta;
}

interface RecordingsState {
  items: RecordingMeta[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (data: { name: string; blob: Blob; mimeType: string; durationSeconds: number }) => Promise<RecordingMeta>;
  rename: (id: number, name: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getBlob: (id: number) => Promise<Blob | null>;
  clearAll: () => Promise<void>;
}

/** SPEC §5.6: recordings persist to IndexedDB via Dexie, newest first. */
export const useRecordingsStore = create<RecordingsState>((set) => ({
  items: [],
  loaded: false,

  load: async () => {
    const records = await db.recordings.orderBy('createdAt').reverse().toArray();
    set({ items: records.map(toMeta), loaded: true });
  },

  add: async (data) => {
    const record: RecordingRecord = {
      name: data.name,
      blob: data.blob,
      mimeType: data.mimeType,
      durationSeconds: data.durationSeconds,
      sizeBytes: data.blob.size,
      createdAt: Date.now(),
    };
    const id = await db.recordings.add(record);
    const meta = toMeta({ ...record, id });
    set((s) => ({ items: [meta, ...s.items] }));
    return meta;
  },

  rename: async (id, name) => {
    await db.recordings.update(id, { name });
    set((s) => ({ items: s.items.map((r) => (r.id === id ? { ...r, name } : r)) }));
  },

  remove: async (id) => {
    await db.recordings.delete(id);
    set((s) => ({ items: s.items.filter((r) => r.id !== id) }));
  },

  getBlob: async (id) => {
    const record = await db.recordings.get(id);
    return record?.blob ?? null;
  },

  clearAll: async () => {
    await db.recordings.clear();
    set({ items: [] });
  },
}));
