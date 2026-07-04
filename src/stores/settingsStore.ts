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
  /** SPEC §5.8: guitar-tone volume, shared by every Karplus-Strong voice (fretboard/chords/progression). */
  guitarVolume: number;
  /** SPEC §5.8: click-tone volume, shared by the metronome and progression click tracks. */
  clickVolume: number;
  /** SPEC §4.4/§5.8: Screen Wake Lock during any playback (metronome or progression). */
  wakeLockEnabled: boolean;
  /** SPEC §5.8: one-time "add to home screen" banner, shown once on first launch. */
  hasSeenOnboarding: boolean;
  /** SPEC §5.7: daily practice goal in minutes, used for the heatmap's achievement ring. */
  dailyGoalMinutes: number;

  setLeftHanded: (v: boolean) => void;
  setA4: (hz: number) => void;
  setNoteNaming: (n: Partial<NoteNamingPreference>) => void;
  setTheme: (t: ThemePreference) => void;
  setCurrentTuningId: (id: string) => void;
  setGuitarVolume: (v: number) => void;
  setClickVolume: (v: number) => void;
  setWakeLockEnabled: (v: boolean) => void;
  setHasSeenOnboarding: (v: boolean) => void;
  setDailyGoalMinutes: (v: number) => void;
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
      guitarVolume: 80,
      clickVolume: 80,
      wakeLockEnabled: true,
      hasSeenOnboarding: false,
      dailyGoalMinutes: 20,

      setLeftHanded: (v) => set({ leftHanded: v }),
      setA4: (hz) => set({ a4: clamp(hz, 415, 466) }),
      setNoteNaming: (n) => set((s) => ({ noteNaming: { ...s.noteNaming, ...n } })),
      setTheme: (t) => set({ theme: t }),
      setCurrentTuningId: (id) => set({ currentTuningId: id }),
      setGuitarVolume: (v) => set({ guitarVolume: clamp(v, 0, 100) }),
      setClickVolume: (v) => set({ clickVolume: clamp(v, 0, 100) }),
      setWakeLockEnabled: (v) => set({ wakeLockEnabled: v }),
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
      setDailyGoalMinutes: (v) => set({ dailyGoalMinutes: clamp(v, 1, 600) }),
    }),
    { name: 'fretlab-settings' },
  ),
);
