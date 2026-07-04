import Dexie, { type Table } from 'dexie';
import type { Midi } from '../theory/pitch';
import type { Progression } from './progressionTypes';

export interface CustomTuningRecord {
  id?: number;
  name: string;
  /** 6 absolute MIDI values, string6 → string1. */
  tuning: Midi[];
  createdAt: number;
}

/** User-created progressions (SPEC §5.3): bundled presets are static data, not stored here. */
export type ProgressionRecord = Progression;

/**
 * IndexedDB store for user-created data (SPEC §2.2: settings live in
 * localStorage via Zustand persist; custom tunings, recordings, progressions
 * and practice logs live in IndexedDB via Dexie).
 */
export class FretLabDB extends Dexie {
  customTunings!: Table<CustomTuningRecord, number>;
  progressions!: Table<ProgressionRecord, string>;

  constructor() {
    super('fretlab');
    this.version(1).stores({
      customTunings: '++id, name, createdAt',
    });
    this.version(2).stores({
      customTunings: '++id, name, createdAt',
      progressions: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new FretLabDB();
