import Dexie, { type Table } from 'dexie';
import type { Midi } from '../theory/pitch';
import type { Progression } from './progressionTypes';
import type { AutoPracticeRow, ManualPracticeRow } from './practiceLogTypes';

export interface CustomTuningRecord {
  id?: number;
  name: string;
  /** 6 absolute MIDI values, string6 → string1. */
  tuning: Midi[];
  createdAt: number;
}

/** User-created progressions (SPEC §5.3): bundled presets are static data, not stored here. */
export type ProgressionRecord = Progression;

/** SPEC §5.6: recorded audio, stored as a Blob directly (Dexie supports this natively). */
export interface RecordingRecord {
  id?: number;
  name: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  sizeBytes: number;
  createdAt: number;
}

/** SPEC §5.7: one row per (date, feature), incremented as active/playback time accrues. */
export type AutoPracticeRecord = AutoPracticeRow;
/** SPEC §5.7: freeform manual practice-log entries. */
export type ManualPracticeRecord = ManualPracticeRow;

/**
 * IndexedDB store for user-created data (SPEC §2.2: settings live in
 * localStorage via Zustand persist; custom tunings, recordings, progressions
 * and practice logs live in IndexedDB via Dexie).
 */
export class FretLabDB extends Dexie {
  customTunings!: Table<CustomTuningRecord, number>;
  progressions!: Table<ProgressionRecord, string>;
  recordings!: Table<RecordingRecord, number>;
  practiceAuto!: Table<AutoPracticeRecord, [string, string]>;
  practiceManual!: Table<ManualPracticeRecord, number>;

  constructor() {
    super('fretlab');
    this.version(1).stores({
      customTunings: '++id, name, createdAt',
    });
    this.version(2).stores({
      customTunings: '++id, name, createdAt',
      progressions: 'id, name, createdAt, updatedAt',
    });
    this.version(3).stores({
      customTunings: '++id, name, createdAt',
      progressions: 'id, name, createdAt, updatedAt',
      recordings: '++id, name, createdAt',
    });
    this.version(4).stores({
      customTunings: '++id, name, createdAt',
      progressions: 'id, name, createdAt, updatedAt',
      recordings: '++id, name, createdAt',
      practiceAuto: '[date+feature], date, feature',
      practiceManual: '++id, date, createdAt',
    });
  }
}

export const db = new FretLabDB();
