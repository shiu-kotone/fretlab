import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomTuningsStore } from './customTuningsStore';
import { db } from '../data/db';

describe('useCustomTuningsStore', () => {
  beforeEach(async () => {
    await db.customTunings.clear();
    useCustomTuningsStore.setState({ items: [], loaded: false });
  });

  it('starts empty and unloaded', () => {
    expect(useCustomTuningsStore.getState().items).toEqual([]);
    expect(useCustomTuningsStore.getState().loaded).toBe(false);
  });

  it('load() reads persisted custom tunings from IndexedDB', async () => {
    await db.customTunings.add({ name: '愛用チューニング', tuning: [38, 45, 50, 55, 59, 62], createdAt: 1 });
    await useCustomTuningsStore.getState().load();
    const { items, loaded } = useCustomTuningsStore.getState();
    expect(loaded).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('愛用チューニング');
    expect(items[0].id).toMatch(/^custom:\d+$/);
  });

  it('add() persists to IndexedDB and updates in-memory state', async () => {
    const id = await useCustomTuningsStore.getState().add('テスト', [38, 45, 50, 55, 59, 62]);
    expect(useCustomTuningsStore.getState().items.map((i) => i.id)).toContain(id);

    // reload from a clean store slice to confirm it was actually persisted, not just held in memory
    useCustomTuningsStore.setState({ items: [], loaded: false });
    await useCustomTuningsStore.getState().load();
    expect(useCustomTuningsStore.getState().items.map((i) => i.id)).toContain(id);
  });

  it('remove() deletes from IndexedDB and from in-memory state', async () => {
    const id = await useCustomTuningsStore.getState().add('削除対象', [38, 45, 50, 55, 59, 62]);
    await useCustomTuningsStore.getState().remove(id);
    expect(useCustomTuningsStore.getState().items.map((i) => i.id)).not.toContain(id);

    useCustomTuningsStore.setState({ items: [], loaded: false });
    await useCustomTuningsStore.getState().load();
    expect(useCustomTuningsStore.getState().items.map((i) => i.id)).not.toContain(id);
  });
});
