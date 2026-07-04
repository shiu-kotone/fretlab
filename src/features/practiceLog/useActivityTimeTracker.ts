import { useEffect, useRef } from 'react';
import { usePracticeLogStore } from '../../stores/practiceLogStore';
import type { PracticeFeature } from '../../data/practiceLogTypes';

/** SPEC §5.7: idle threshold beyond which active time stops accruing. */
const IDLE_THRESHOLD_MS = 30_000;
const TICK_MS = 10_000;
/** Batches IndexedDB writes to roughly once every 30s of active use, instead of once per tick. */
const FLUSH_EVERY_TICKS = 3;

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const;

/**
 * SPEC §5.7 automatic tracking: credits active time (mounted + a recent
 * input event within the last 30s) to the practice log, in ~30s-batched
 * writes. Mount this once per screen that should count as "active use"
 * (fretboard, chord library, tuner) — playback-driven features (metronome,
 * progression) instead credit their actual play duration directly.
 *
 * `enabled` covers screens that can stay mounted while not actually visible
 * (the コード tab is kept alive in the background so progression playback
 * survives tab switches — SPEC §3.1 — so its chord-library activity tracker
 * must only accrue time while that tab is the one actually on screen).
 * Toggling it off flushes whatever was accumulated so far, same as unmount.
 */
export function useActivityTimeTracker(feature: PracticeFeature, enabled = true): void {
  const creditAutoMinutes = usePracticeLogStore((s) => s.creditAutoMinutes);

  const lastActivityRef = useRef(Date.now());
  const accumulatedSecondsRef = useRef(0);
  const tickCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    // Mounting the screen itself counts as activity, so browsing starts crediting immediately.
    lastActivityRef.current = Date.now();
    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, markActive, { passive: true }));

    const flush = () => {
      if (accumulatedSecondsRef.current <= 0) return;
      const minutes = accumulatedSecondsRef.current / 60;
      accumulatedSecondsRef.current = 0;
      void creditAutoMinutes(feature, minutes);
    };

    const intervalId = window.setInterval(() => {
      const idle = Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS;
      if (!idle) accumulatedSecondsRef.current += TICK_MS / 1000;

      tickCountRef.current += 1;
      if (tickCountRef.current >= FLUSH_EVERY_TICKS) {
        tickCountRef.current = 0;
        flush();
      }
    }, TICK_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, markActive));
      window.clearInterval(intervalId);
      flush();
    };
  }, [feature, creditAutoMinutes, enabled]);
}
