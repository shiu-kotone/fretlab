import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, resolveThemeMode } from './settingsStore';

describe('resolveThemeMode', () => {
  it('an explicit dark/light preference always wins over the system setting', () => {
    expect(resolveThemeMode('dark', false)).toBe('dark');
    expect(resolveThemeMode('light', true)).toBe('light');
  });

  it('follows the system preference when set to "system"', () => {
    expect(resolveThemeMode('system', true)).toBe('dark');
    expect(resolveThemeMode('system', false)).toBe('light');
  });
});

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      leftHanded: false,
      a4: 440,
      noteNaming: { flat: false, solfege: false },
      theme: 'system',
      currentTuningId: 'regular',
    });
  });

  it('clamps A4 to the SPEC §4.2 range of 415-466Hz', () => {
    useSettingsStore.getState().setA4(500);
    expect(useSettingsStore.getState().a4).toBe(466);
    useSettingsStore.getState().setA4(300);
    expect(useSettingsStore.getState().a4).toBe(415);
    useSettingsStore.getState().setA4(442);
    expect(useSettingsStore.getState().a4).toBe(442);
  });

  it('toggles left-handed mode', () => {
    useSettingsStore.getState().setLeftHanded(true);
    expect(useSettingsStore.getState().leftHanded).toBe(true);
  });

  it('merges partial note-naming updates without clobbering the other field', () => {
    useSettingsStore.getState().setNoteNaming({ flat: true });
    expect(useSettingsStore.getState().noteNaming).toEqual({ flat: true, solfege: false });
    useSettingsStore.getState().setNoteNaming({ solfege: true });
    expect(useSettingsStore.getState().noteNaming).toEqual({ flat: true, solfege: true });
  });

  it('updates theme preference', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('updates the current tuning id', () => {
    useSettingsStore.getState().setCurrentTuningId('drop-d');
    expect(useSettingsStore.getState().currentTuningId).toBe('drop-d');
  });

  it('clamps guitar/click volume to 0-100', () => {
    useSettingsStore.getState().setGuitarVolume(150);
    expect(useSettingsStore.getState().guitarVolume).toBe(100);
    useSettingsStore.getState().setClickVolume(-10);
    expect(useSettingsStore.getState().clickVolume).toBe(0);
  });

  it('toggles wake lock and onboarding flags', () => {
    useSettingsStore.getState().setWakeLockEnabled(false);
    expect(useSettingsStore.getState().wakeLockEnabled).toBe(false);
    useSettingsStore.getState().setHasSeenOnboarding(true);
    expect(useSettingsStore.getState().hasSeenOnboarding).toBe(true);
  });

  it('clamps the daily goal to 1-600 minutes', () => {
    useSettingsStore.getState().setDailyGoalMinutes(0);
    expect(useSettingsStore.getState().dailyGoalMinutes).toBe(1);
    useSettingsStore.getState().setDailyGoalMinutes(1000);
    expect(useSettingsStore.getState().dailyGoalMinutes).toBe(600);
  });
});
