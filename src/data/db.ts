import Dexie, { type Table } from 'dexie';
import type { Midi } from '../theory/pitch';

export interface CustomTuningRecord {
  id?: number;
  name: string;
  /** 6 absolute MIDI values, string6 → string1. */
  tuning: Midi[];
  createdAt: number;
}

/**
 * IndexedDB store for user-created data (SPEC §2.2: settings live in
 * localStorage via Zustand persist; custom tunings, recordings and
 * practice logs live in IndexedDB via Dexie).
 */
export class FretLabDB extends Dexie {
  customTunings!: Table<CustomTuningRecord, number>;

  constructor() {
    super('fretlab');
    this.version(1).stores({
      customTunings: '++id, name, createdAt',
    });
  }
}

export const db = new FretLabDB();
