import { useCallback, useEffect, useRef, useState } from 'react';
import type { Progression } from '../../data/progressionTypes';
import { computeBarSegments, findActiveSegment, type BarSegment } from '../../data/progressionTypes';
import { parseChordId, getVoicingsForChord } from '../../data/chordLibrary';
import { findStrumPattern } from '../../data/strumPatterns';
import type { Voicing } from '../../data/voicingTypes';
import { getAudioContext, getClickGain, getGuitarSynth, unlockAudio } from '../../audio/AudioEngine';
import { LookaheadScheduler } from '../../audio/LookaheadScheduler';
import { synthesizeClick } from '../../audio/click';
import { secondsPerBeatFromBpm, tickTimings, type TempoParams, type TickEvent } from '../../audio/beatPlan';
import { REGULAR_TUNING, fretToMidi } from '../../theory/pitch';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMetronomeStore } from '../../stores/metronomeStore';
import { usePlaybackCoordinatorStore } from '../../stores/playbackCoordinatorStore';
import { usePracticeLogStore } from '../../stores/practiceLogStore';

const COUNT_IN_BARS = 1;
/** Tolerance for matching a strum-pattern step's beat offset against the scheduler's tick grid (well under the smallest real spacing of 0.25 beat). */
const STEP_EPSILON = 1e-4;
const STRUM_STAGGER_SECONDS = 0.025;

export interface ActiveChordInfo {
  root: number;
  typeId: string;
  voicing: Voicing;
  chordId: string;
}

function resolveChord(chordId: string, voicingIndex: number): ActiveChordInfo | null {
  const parsed = parseChordId(chordId);
  if (!parsed) return null;
  const voicings = getVoicingsForChord(parsed.root, parsed.typeId);
  const voicing = voicings[voicingIndex] ?? voicings[0];
  if (!voicing) return null;
  return { root: parsed.root, typeId: parsed.typeId, voicing, chordId };
}

function firstSegmentInfo(p: Progression, barIndex: number): ActiveChordInfo | null {
  const bar = p.bars[barIndex];
  if (!bar) return null;
  const segment = computeBarSegments(bar)[0];
  if (!segment) return null;
  return resolveChord(segment.chordId, segment.voicingIndex);
}

/**
 * Scheduled the same way as the metronome (SPEC §4.4 lookahead scheduler,
 * never setTimeout-per-note for pulse timing): the click track uses
 * sample-accurate `synthesizeClick(ctx, dest, event.time, ...)`. Chord
 * strums/plucks go through the Karplus-Strong synth, whose worklet protocol
 * has no "start at time T" parameter (it fires on message receipt) — so note
 * onsets are bridged from the lookahead-computed absolute time via a bounded
 * setTimeout, the same technique already used for this engine's visual beat
 * flash. This keeps click timing fully sample-accurate while chord-strum
 * onsets carry a few ms of setTimeout jitter, which is inaudible for a
 * strummed chord (itself already a 25ms-spread event).
 */
export function useProgressionEngine(progression: Progression | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBarIndex, setCurrentBarIndex] = useState<number | null>(null);
  const [currentChord, setCurrentChord] = useState<ActiveChordInfo | null>(null);
  const [nextChord, setNextChord] = useState<ActiveChordInfo | null>(null);
  const [clickEnabled, setClickEnabled] = useState(true);
  const [bpm, setBpmState] = useState(progression?.bpm ?? 100);

  const schedulerRef = useRef<LookaheadScheduler | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const progressionRef = useRef(progression);
  const clickEnabledRef = useRef(clickEnabled);
  const bpmRef = useRef(bpm);
  const lastSegmentKeyRef = useRef<string | null>(null);
  const playStartRef = useRef<number | null>(null);

  useEffect(() => {
    progressionRef.current = progression;
    if (progression) {
      bpmRef.current = progression.bpm;
      setBpmState(progression.bpm);
    }
  }, [progression]);
  useEffect(() => {
    clickEnabledRef.current = clickEnabled;
  }, [clickEnabled]);

  /** SPEC §5.3 "BPMは再生中も変更可(次拍から反映)": read fresh every tick, like the metronome engine. */
  const setBpm = useCallback((v: number) => {
    const clamped = Math.max(40, Math.min(240, v));
    bpmRef.current = clamped;
    setBpmState(clamped);
  }, []);

  const stop = useCallback(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;
    lastSegmentKeyRef.current = null;
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setIsPlaying(false);
    setCurrentBarIndex(null);
    setCurrentChord(null);
    setNextChord(null);
    usePlaybackCoordinatorStore.getState().release('progression');

    // SPEC §5.7: credit this session's playback time to today's practice log.
    if (playStartRef.current !== null) {
      const minutes = (performance.now() - playStartRef.current) / 60000;
      playStartRef.current = null;
      void usePracticeLogStore.getState().creditAutoMinutes('progression', minutes);
    }
  }, []);

  // SPEC §4.5: metronome playback claims exclusive ownership on start; stop if it takes over while we're playing.
  useEffect(
    () =>
      usePlaybackCoordinatorStore.subscribe((s) => {
        if (s.activeOwner !== 'progression' && schedulerRef.current) {
          stop();
        }
      }),
    [stop],
  );

  const updateDisplay = useCallback((p: Progression, effectiveBarIndex: number, segments: BarSegment[], segment: BarSegment) => {
    const key = `${effectiveBarIndex}:${segment.startBeat}`;
    if (lastSegmentKeyRef.current === key) return;
    lastSegmentKeyRef.current = key;

    setCurrentBarIndex(effectiveBarIndex);
    setCurrentChord(resolveChord(segment.chordId, segment.voicingIndex));

    const segIndex = segments.indexOf(segment);
    if (segIndex >= 0 && segIndex < segments.length - 1) {
      const nextSeg = segments[segIndex + 1];
      setNextChord(resolveChord(nextSeg.chordId, nextSeg.voicingIndex));
    } else {
      const isLastBar = effectiveBarIndex >= p.bars.length - 1;
      if (isLastBar && !p.loop) {
        setNextChord(null);
      } else {
        const nextBarIndex = (effectiveBarIndex + 1) % p.bars.length;
        setNextChord(firstSegmentInfo(p, nextBarIndex));
      }
    }
  }, []);

  const playStrumAction = useCallback(
    (ctx: AudioContext, voicing: Voicing, action: { kind: 'strum'; direction: 'D' | 'U' } | { kind: 'pluck'; stringIndex: number }, time: number, accent: boolean) => {
      const synth = getGuitarSynth();
      const a4 = useSettingsStore.getState().a4;
      const velocity = accent ? 0.9 : 0.7;

      const triggerAt = (stringIndex: number, delaySeconds: number) => {
        const fret = voicing.frets[stringIndex];
        if (fret === 'x' || fret === undefined) return;
        const midi = fretToMidi(stringIndex, fret, REGULAR_TUNING);
        const targetTime = time + delaySeconds;
        const delayMs = Math.max(0, (targetTime - ctx.currentTime) * 1000);
        window.setTimeout(() => {
          synth.pluck(midi, { a4, velocity, brightness: 0.5, sustainSeconds: 2 });
        }, delayMs);
      };

      if (action.kind === 'pluck') {
        triggerAt(action.stringIndex, 0);
        return;
      }

      const order = action.direction === 'D' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
      order.forEach((stringIndex, i) => triggerAt(stringIndex, i * STRUM_STAGGER_SECONDS));
    },
    [],
  );

  const start = useCallback(async () => {
    const p = progressionRef.current;
    if (!p) return;
    usePlaybackCoordinatorStore.getState().claim('progression');
    await unlockAudio();
    const ctx = getAudioContext();
    bpmRef.current = p.bpm;
    setBpmState(p.bpm);

    if (useSettingsStore.getState().wakeLockEnabled && 'wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          wakeLockRef.current = sentinel;
        })
        .catch(() => {
          // Not fatal (SPEC §4.4): playback continues without the lock.
        });
    }

    lastSegmentKeyRef.current = null;
    setCurrentBarIndex(null);
    setCurrentChord(null);
    setNextChord(firstSegmentInfo(p, 0));

    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => ctx.currentTime,
      getTempoParams: (): TempoParams => {
        const pattern = findStrumPattern(p.strumPatternId);
        const shuffle = pattern.kind === 'rate' && pattern.shuffle === true;
        return {
          beatsPerBar: p.timeSig.beats,
          secondsPerBeat: secondsPerBeatFromBpm(bpmRef.current),
          subdivision: shuffle ? 'shuffle' : 'sixteenth',
        };
      },
      onTick: (event: TickEvent) => {
        const progressionBarIndex = event.barIndex - COUNT_IN_BARS;
        const clickTone = useMetronomeStore.getState().tone;

        if (progressionBarIndex < 0) {
          if (clickEnabledRef.current && event.isMainBeat) {
            synthesizeClick(ctx, getClickGain(), event.time, clickTone, event.beatIndex === 0 ? 'accent' : 'normal');
          }
          return;
        }

        if (!p.loop && progressionBarIndex >= p.bars.length) {
          stop();
          return;
        }

        const effectiveBarIndex = progressionBarIndex % p.bars.length;

        if (clickEnabledRef.current && event.isMainBeat) {
          synthesizeClick(ctx, getClickGain(), event.time, clickTone, event.beatIndex === 0 ? 'accent' : 'normal');
        }

        const bar = p.bars[effectiveBarIndex];
        const segments = computeBarSegments(bar);

        // The same subdivision choice getTempoParams() made for this tick (both derive from the same immutable `p.strumPatternId`), so this is guaranteed consistent with how the scheduler built `event`.
        const pattern = findStrumPattern(p.strumPatternId);
        const subdivision = pattern.kind === 'rate' && pattern.shuffle === true ? 'shuffle' : 'sixteenth';
        const offsetInBeat = tickTimings(subdivision)[event.tickIndexInBeat]?.offsetInBeat ?? 0;
        const beatPosition = event.beatIndex + offsetInBeat;
        const segment = findActiveSegment(segments, beatPosition);
        if (!segment) return;

        updateDisplay(p, effectiveBarIndex, segments, segment);

        const chordInfo = resolveChord(segment.chordId, segment.voicingIndex);
        if (!chordInfo) return;

        const segmentRelativeBeat = beatPosition - segment.startBeat;

        if (pattern.kind === 'rate') {
          const localPos = ((segmentRelativeBeat % pattern.cycleBeats) + pattern.cycleBeats) % pattern.cycleBeats;
          for (const step of pattern.steps) {
            if (Math.abs(localPos - step.offsetBeats) < STEP_EPSILON) {
              playStrumAction(ctx, chordInfo.voicing, step.action, event.time, step.accent === true);
            }
          }
        } else {
          const hits = Array.from({ length: pattern.hitsPerSegment }, (_, i) => (i * segment.beats) / pattern.hitsPerSegment);
          hits.forEach((hitOffset, i) => {
            if (Math.abs(segmentRelativeBeat - hitOffset) < STEP_EPSILON) {
              playStrumAction(ctx, chordInfo.voicing, { kind: 'strum', direction: 'D' }, event.time, i === 0);
            }
          });
        }
      },
    });

    schedulerRef.current = scheduler;
    playStartRef.current = performance.now();
    scheduler.start(ctx.currentTime + 0.05);
    setIsPlaying(true);
  }, [stop, updateDisplay, playStrumAction]);

  const toggle = useCallback(() => {
    if (schedulerRef.current) {
      stop();
    } else {
      void start();
    }
  }, [start, stop]);

  useEffect(() => stop, [stop]);

  return {
    isPlaying,
    currentBarIndex,
    currentChord,
    nextChord,
    clickEnabled,
    setClickEnabled,
    bpm,
    setBpm,
    start,
    stop,
    toggle,
  };
}
