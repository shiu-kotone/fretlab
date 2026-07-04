import { useCallback, useEffect, useRef, useState } from 'react';
import { useMetronomeStore, type SpeedTrainerSettings, type MuteBarsSettings } from '../../stores/metronomeStore';
import { usePlaybackCoordinatorStore } from '../../stores/playbackCoordinatorStore';
import { useMetronomeControlStore } from '../../stores/metronomeControlStore';
import { getAudioContext, getClickGain, setClickVolume, unlockAudio } from '../../audio/AudioEngine';
import { LookaheadScheduler } from '../../audio/LookaheadScheduler';
import { synthesizeClick, type ClickLevel } from '../../audio/click';
import { secondsPerBeatFromBpm, type TempoParams, type TickEvent } from '../../audio/beatPlan';
import { computeSpeedTrainerBpm, isBarMuted } from '../../audio/trainer';

export interface BeatFlash {
  key: number;
  barIndex: number;
  beatIndex: number;
  tickIndexInBeat: number;
  isMainBeat: boolean;
  /** 'mute' covers both a muted accent-dot beat and a trainer-muted bar. */
  level: ClickLevel | 'mute';
}

export function useMetronomeEngine() {
  const isPlaying = useMetronomeStore((s) => s.isPlaying);
  const clickVolume = useMetronomeStore((s) => s.clickVolume);
  const [flash, setFlash] = useState<BeatFlash | null>(null);

  const schedulerRef = useRef<LookaheadScheduler | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const flashTimeoutsRef = useRef<number[]>([]);
  const barIndexRef = useRef(0);
  const startingBpmRef = useRef(useMetronomeStore.getState().bpm);

  // Keep click volume live even while playing (SPEC §4.4: adjustable at any time).
  useEffect(() => {
    setClickVolume(clickVolume);
  }, [clickVolume]);

  const clearFlashTimeouts = () => {
    flashTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    flashTimeoutsRef.current = [];
  };

  const stop = useCallback(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;
    clearFlashTimeouts();
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    useMetronomeStore.getState().setIsPlaying(false);
    setFlash(null);
    usePlaybackCoordinatorStore.getState().release('metronome');
  }, []);

  // SPEC §4.5: progression playback claims exclusive ownership on start; stop
  // if it takes over while we're still playing.
  useEffect(
    () =>
      usePlaybackCoordinatorStore.subscribe((s) => {
        if (s.activeOwner !== 'metronome' && useMetronomeStore.getState().isPlaying) {
          stop();
        }
      }),
    [stop],
  );

  const start = useCallback(async () => {
    usePlaybackCoordinatorStore.getState().claim('metronome');
    await unlockAudio();
    const ctx = getAudioContext();
    setClickVolume(useMetronomeStore.getState().clickVolume);

    barIndexRef.current = 0;
    startingBpmRef.current = useMetronomeStore.getState().bpm;

    if (useMetronomeStore.getState().wakeLockEnabled && 'wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          wakeLockRef.current = sentinel;
        })
        .catch(() => {
          // Not fatal (SPEC §4.4): playback continues without the lock.
        });
    }

    const subGain = ctx.createGain();
    subGain.connect(getClickGain());

    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => ctx.currentTime,
      getTempoParams: (): TempoParams => {
        const s = useMetronomeStore.getState();
        const bpm = s.speedTrainer.enabled
          ? computeSpeedTrainerBpm(startingBpmRef.current, barIndexRef.current, s.speedTrainer as SpeedTrainerSettings)
          : s.bpm;
        return {
          beatsPerBar: s.timeSig.beats,
          secondsPerBeat: secondsPerBeatFromBpm(bpm),
          subdivision: s.subdivision,
        };
      },
      onTick: (event: TickEvent) => {
        const s = useMetronomeStore.getState();
        barIndexRef.current = event.barIndex;

        const barMuted = isBarMuted(event.barIndex, s.muteBars as MuteBarsSettings);
        const accentState = s.accentPattern[event.beatIndex] ?? 'normal';
        const beatMuted = accentState === 'mute';
        const shouldSound = !barMuted && !beatMuted;

        if (shouldSound) {
          if (event.isMainBeat) {
            const level: ClickLevel = accentState === 'accent' ? 'accent' : 'normal';
            synthesizeClick(ctx, getClickGain(), event.time, s.tone, level);
          } else {
            subGain.gain.setValueAtTime(s.subVolume / 100, event.time);
            synthesizeClick(ctx, subGain, event.time, s.tone, 'sub');
          }
        }

        // Visual flash is aligned to the audio clock via a plain setTimeout; a few ms
        // of visual jitter is acceptable (only the audio scheduling itself must hold
        // the ±3ms budget from SPEC §5.4, which is guaranteed by AudioContext scheduling).
        const delayMs = Math.max(0, (event.time - ctx.currentTime) * 1000);
        const timeoutId = window.setTimeout(() => {
          setFlash({
            key: event.time,
            barIndex: event.barIndex,
            beatIndex: event.beatIndex,
            tickIndexInBeat: event.tickIndexInBeat,
            isMainBeat: event.isMainBeat,
            level: !shouldSound ? 'mute' : event.isMainBeat ? (accentState as ClickLevel) : 'sub',
          });
        }, delayMs);
        flashTimeoutsRef.current.push(timeoutId);
      },
    });

    schedulerRef.current = scheduler;
    scheduler.start(ctx.currentTime + 0.05);
    useMetronomeStore.getState().setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (useMetronomeStore.getState().isPlaying) {
      stop();
    } else {
      void start();
    }
  }, [start, stop]);

  // Publish this instance's toggle so other features (the recorder, SPEC
  // §5.6 "録音画面からメトロノームを起動可") can control the one always-mounted
  // engine instead of spawning a second scheduler.
  useEffect(() => {
    useMetronomeControlStore.getState().setToggle(toggle);
    return () => useMetronomeControlStore.getState().setToggle(null);
  }, [toggle]);

  // Release resources if the whole app unmounts (e.g. page navigation), but NOT on
  // tab switches — App.tsx keeps this component mounted so playback survives them
  // (SPEC §5.4: "再生状態はタブ移動しても継続").
  useEffect(() => stop, [stop]);

  return { isPlaying, flash, toggle };
}
