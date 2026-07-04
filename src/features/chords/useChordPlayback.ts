import { useCallback, useEffect, useRef } from 'react';
import type { Voicing } from '../../data/voicingTypes';
import { REGULAR_TUNING, fretToMidi } from '../../theory/pitch';
import { useSettingsStore } from '../../stores/settingsStore';
import { getGuitarSynth, unlockAudio } from '../../audio/AudioEngine';

const STRUM_STAGGER_MS = 30;
const ARPEGGIO_STAGGER_MS = 120;

/**
 * SPEC §5.2: strum (6th->1st string, 30ms stagger) and arpeggio (120ms
 * stagger) playback. Chord diagrams are always regular tuning (SPEC §4.2
 * "コードライブラリのボイシングDBはレギュラーチューニング前提"), and the
 * play order follows the voicing's string index regardless of left-handed
 * display mirroring ("左利き設定でも音順は同じ") — mirroring is display-only.
 */
export function useChordPlayback() {
  const a4 = useSettingsStore((s) => s.a4);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const playVoicing = useCallback(
    async (voicing: Voicing, staggerMs: number) => {
      await unlockAudio();
      clearTimers();
      const synth = getGuitarSynth();
      voicing.frets.forEach((fret, stringIndex) => {
        if (fret === 'x') return;
        const midi = fretToMidi(stringIndex, fret, REGULAR_TUNING);
        const timer = window.setTimeout(() => {
          synth.pluck(midi, { a4, velocity: 0.8, brightness: 0.5, sustainSeconds: 2 });
        }, stringIndex * staggerMs);
        timersRef.current.push(timer);
      });
    },
    [a4, clearTimers],
  );

  const strum = useCallback((voicing: Voicing) => void playVoicing(voicing, STRUM_STAGGER_MS), [playVoicing]);
  const arpeggio = useCallback((voicing: Voicing) => void playVoicing(voicing, ARPEGGIO_STAGGER_MS), [playVoicing]);

  useEffect(() => clearTimers, [clearTimers]);

  return { strum, arpeggio };
}
