import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'dark' | 'light';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));

export interface NoteNamingPreference {
  flat: boolean;
  solfege: boolean;
}

interface SettingsState {
  /** SPEC §4.1: global left-handed mode. Rendering code mirrors coordinates; data is never flipped. */
  leftHanded: boolean;
  /** SPEC §4.2: reference pitch, 415-466Hz. */
  a4: number;
  /** SPEC §4.3: note name display preferences. */
  noteNaming: NoteNamingPreference;
  /** SPEC §4.6: theme preference; 'system' follows the OS setting. */
  theme: ThemePreference;
  /** SPEC §4.2: id of a TuningPreset, or `custom:<id>` referencing a Dexie-stored custom tuning. */
  currentTuningId: string;

  setLeftHanded: (v: boolean) => void;
  setA4: (hz: number) => void;
  setNoteNaming: (n: Partial<NoteNamingPreference>) => void;
  setTheme: (t: ThemePreference) => void;
  setCurrentTuningId: (id: string) => void;
}

export function resolveThemeMode(preference: ThemePreference, systemPrefersDark: boolean): 'dark' | 'light' {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      leftHanded: false,
      a4: 440,
      noteNaming: { flat: false, solfege: false },
      theme: 'system',
      currentTuningId: 'regular',

      setLeftHanded: (v) => set({ leftHanded: v }),
      setA4: (hz) => set({ a4: clamp(hz, 415, 466) }),
      setNoteNaming: (n) => set((s) => ({ noteNaming: { ...s.noteNaming, ...n } })),
      setTheme: (t) => set({ theme: t }),
      setCurrentTuningId: (id) => set({ currentTuningId: id }),
    }),
    { name: 'fretlab-settings' },
  ),
);
