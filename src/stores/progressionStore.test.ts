import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useProgressionStore } from './progressionStore';
import { db } from '../data/db';

describe('useProgressionStore', () => {
  beforeEach(async () => {
    await db.progressions.clear();
    useProgressionStore.setState({ items: [], loaded: false });
  });

  it('starts empty and unloaded', () => {
    expect(useProgressionStore.getState().items).toEqual([]);
    expect(useProgressionStore.getState().loaded).toBe(false);
  });

  it('create() persists a new progression and updates in-memory state', async () => {
    const p = await useProgressionStore.getState().create('マイ進行');
    expect(useProgressionStore.getState().items.map((i) => i.id)).toContain(p.id);

    useProgressionStore.setState({ items: [], loaded: false });
    await useProgressionStore.getState().load();
    expect(useProgressionStore.getState().items.map((i) => i.id)).toContain(p.id);
  });

  it('duplicate() copies a progression (e.g. a bundled preset) with a new id', async () => {
    const original = await useProgressionStore.getState().create('元の進行');
    const copy = await useProgressionStore.getState().duplicate(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).not.toBe(original.name);
    expect(copy.bars).toEqual(original.bars);
    expect(useProgressionStore.getState().items).toHaveLength(2);
  });

  it('update() persists changes and bumps updatedAt', async () => {
    const p = await useProgressionStore.getState().create('編集対象');
    const before = p.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    await useProgressionStore.getState().update({ ...p, name: '編集後', bpm: 120 });

    const found = useProgressionStore.getState().items.find((i) => i.id === p.id)!;
    expect(found.name).toBe('編集後');
    expect(found.bpm).toBe(120);
    expect(found.updatedAt).toBeGreaterThan(before);
  });

  it('remove() deletes from IndexedDB and in-memory state', async () => {
    const p = await useProgressionStore.getState().create('削除対象');
    await useProgressionStore.getState().remove(p.id);
    expect(useProgressionStore.getState().items.map((i) => i.id)).not.toContain(p.id);

    useProgressionStore.setState({ items: [], loaded: false });
    await useProgressionStore.getState().load();
    expect(useProgressionStore.getState().items.map((i) => i.id)).not.toContain(p.id);
  });
});
