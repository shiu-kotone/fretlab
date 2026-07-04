import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useRecordingsStore } from './recordingsStore';
import { db } from '../data/db';

function makeBlob(sizeBytes: number): Blob {
  return new Blob([new Uint8Array(sizeBytes)], { type: 'audio/webm' });
}

describe('useRecordingsStore', () => {
  beforeEach(async () => {
    await db.recordings.clear();
    useRecordingsStore.setState({ items: [], loaded: false });
  });

  it('starts empty and unloaded', () => {
    expect(useRecordingsStore.getState().items).toEqual([]);
    expect(useRecordingsStore.getState().loaded).toBe(false);
  });

  it('add() persists metadata + blob, and the in-memory list omits the blob', async () => {
    const meta = await useRecordingsStore.getState().add({ name: '録音 テスト', blob: makeBlob(1000), mimeType: 'audio/webm', durationSeconds: 12 });
    expect(meta.sizeBytes).toBe(1000);
    expect('blob' in meta).toBe(false);
    expect(useRecordingsStore.getState().items[0].id).toBe(meta.id);
  });

  it('load() lists newest first', async () => {
    const a = await useRecordingsStore.getState().add({ name: 'A', blob: makeBlob(10), mimeType: 'audio/webm', durationSeconds: 1 });
    await new Promise((r) => setTimeout(r, 2));
    const b = await useRecordingsStore.getState().add({ name: 'B', blob: makeBlob(10), mimeType: 'audio/webm', durationSeconds: 1 });

    useRecordingsStore.setState({ items: [], loaded: false });
    await useRecordingsStore.getState().load();
    const ids = useRecordingsStore.getState().items.map((r) => r.id);
    expect(ids[0]).toBe(b.id);
    expect(ids[1]).toBe(a.id);
  });

  it('rename() updates both IndexedDB and in-memory state', async () => {
    const meta = await useRecordingsStore.getState().add({ name: '元の名前', blob: makeBlob(10), mimeType: 'audio/webm', durationSeconds: 1 });
    await useRecordingsStore.getState().rename(meta.id, '新しい名前');
    expect(useRecordingsStore.getState().items.find((r) => r.id === meta.id)?.name).toBe('新しい名前');

    useRecordingsStore.setState({ items: [], loaded: false });
    await useRecordingsStore.getState().load();
    expect(useRecordingsStore.getState().items.find((r) => r.id === meta.id)?.name).toBe('新しい名前');
  });

  it('remove() deletes from IndexedDB and in-memory state', async () => {
    const meta = await useRecordingsStore.getState().add({ name: '削除対象', blob: makeBlob(10), mimeType: 'audio/webm', durationSeconds: 1 });
    await useRecordingsStore.getState().remove(meta.id);
    expect(useRecordingsStore.getState().items).toHaveLength(0);

    useRecordingsStore.setState({ items: [], loaded: false });
    await useRecordingsStore.getState().load();
    expect(useRecordingsStore.getState().items).toHaveLength(0);
  });

  it('getBlob() fetches the stored record by id', async () => {
    // Note: jsdom's Blob doesn't round-trip cleanly through fake-indexeddb's
    // structured-clone shim (verified fine against a real Blob in plain
    // Node), so this only checks a record comes back, not byte fidelity —
    // real browsers store/retrieve Blobs in IndexedDB natively.
    const meta = await useRecordingsStore.getState().add({ name: 'X', blob: makeBlob(42), mimeType: 'audio/webm', durationSeconds: 1 });
    const blob = await useRecordingsStore.getState().getBlob(meta.id);
    expect(blob).not.toBeNull();
  });

  it('getBlob() returns null for a missing id', async () => {
    expect(await useRecordingsStore.getState().getBlob(99999)).toBeNull();
  });

  it('clearAll() wipes IndexedDB and in-memory state', async () => {
    await useRecordingsStore.getState().add({ name: 'A', blob: makeBlob(10), mimeType: 'audio/webm', durationSeconds: 1 });
    await useRecordingsStore.getState().add({ name: 'B', blob: makeBlob(10), mimeType: 'audio/webm', durationSeconds: 1 });
    await useRecordingsStore.getState().clearAll();
    expect(useRecordingsStore.getState().items).toEqual([]);

    await useRecordingsStore.getState().load();
    expect(useRecordingsStore.getState().items).toEqual([]);
  });
});
