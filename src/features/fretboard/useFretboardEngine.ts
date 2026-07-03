import { useCallback, useRef, useState } from 'react';
import type { Midi } from '../../theory/pitch';
import { fretToMidi } from '../../theory/pitch';
import { scaleTones } from '../../theory/scales';
import { pointToFretPosition, VIEW_WIDTH, boardHeight } from './fretboardGeometry';
import { useFretboardStore } from '../../stores/fretboardStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getGuitarSynth, unlockAudio } from '../../audio/AudioEngine';

const LONG_PRESS_MS = 500;
const GLOW_DURATION_MS = 1500;
/** Logical (viewBox) units of movement past which a held pointer is treated as a slide, not a long-press-in-place. */
const MOVE_CANCEL_THRESHOLD = 12;

export interface ActiveGlow {
  key: string;
  /** 'muted' = SPEC §5.1 "スケール外タップは灰色フラッシュで区別". */
  kind: 'active' | 'muted';
}

interface PointerState {
  tuningIndex: number;
  fret: number;
  startX: number;
  startY: number;
  longPressTimer: number | null;
}

export function useFretboardEngine(tuning: Midi[]) {
  const orientation = useFretboardStore((s) => s.stringOrientation);
  const zoomFrets = useFretboardStore((s) => s.zoomFrets);
  const overlayMode = useFretboardStore((s) => s.overlayMode);
  const scale = useFretboardStore((s) => s.scale);
  const setDegreeRoot = useFretboardStore((s) => s.setDegreeRoot);
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const a4 = useSettingsStore((s) => s.a4);

  const svgRef = useRef<SVGSVGElement>(null);
  const [activeGlows, setActiveGlows] = useState<Map<string, ActiveGlow>>(new Map());
  const [tappedPositions, setTappedPositions] = useState<Set<string>>(new Set());
  const pointersRef = useRef<Map<number, PointerState>>(new Map());

  const addGlow = useCallback((tuningIndex: number, fret: number, kind: ActiveGlow['kind']) => {
    const key = `${tuningIndex}-${fret}`;
    setActiveGlows((prev) => {
      const next = new Map(prev);
      next.set(key, { key, kind });
      return next;
    });
    window.setTimeout(() => {
      setActiveGlows((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    }, GLOW_DURATION_MS);
  }, []);

  const pluck = useCallback(
    (tuningIndex: number, fret: number) => {
      const midi = fretToMidi(tuningIndex, fret, tuning);
      void unlockAudio().then(() => {
        getGuitarSynth().pluck(midi, { a4, velocity: 0.85, brightness: 0.55, sustainSeconds: 2 });
      });

      const key = `${tuningIndex}-${fret}`;
      setTappedPositions((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

      let kind: ActiveGlow['kind'] = 'active';
      if (overlayMode === 'scale') {
        const pc = ((midi % 12) + 12) % 12;
        if (!scaleTones(scale.rootPc, scale.scaleId).includes(pc)) kind = 'muted';
      }
      addGlow(tuningIndex, fret, kind);

      if (overlayMode === 'degree' && useFretboardStore.getState().degree.rootMidi === null) {
        setDegreeRoot(midi);
      }
      return midi;
    },
    [tuning, a4, overlayMode, scale, addGlow, setDegreeRoot],
  );

  const resolvePosition = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const scaleX = VIEW_WIDTH / rect.width;
      const scaleY = boardHeight() / rect.height;
      let x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      if (leftHanded) x = VIEW_WIDTH - x;
      return pointToFretPosition(x, y, zoomFrets, orientation);
    },
    [leftHanded, zoomFrets, orientation],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const pos = resolvePosition(e.clientX, e.clientY);
      if (!pos) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      pluck(pos.tuningIndex, pos.fret);

      const timer = window.setTimeout(() => {
        if (overlayMode === 'degree') {
          setDegreeRoot(fretToMidi(pos.tuningIndex, pos.fret, tuning));
        }
      }, LONG_PRESS_MS);

      pointersRef.current.set(e.pointerId, {
        tuningIndex: pos.tuningIndex,
        fret: pos.fret,
        startX: e.clientX,
        startY: e.clientY,
        longPressTimer: timer,
      });
    },
    [resolvePosition, pluck, overlayMode, setDegreeRoot, tuning],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const state = pointersRef.current.get(e.pointerId);
      if (!state) return;
      const moved = Math.hypot(e.clientX - state.startX, e.clientY - state.startY);
      if (moved > MOVE_CANCEL_THRESHOLD && state.longPressTimer !== null) {
        window.clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }

      const pos = resolvePosition(e.clientX, e.clientY);
      if (!pos) return;
      if (pos.tuningIndex !== state.tuningIndex || pos.fret !== state.fret) {
        pluck(pos.tuningIndex, pos.fret);
        pointersRef.current.set(e.pointerId, { ...state, tuningIndex: pos.tuningIndex, fret: pos.fret });
      }
    },
    [resolvePosition, pluck],
  );

  const releasePointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const state = pointersRef.current.get(e.pointerId);
    if (state?.longPressTimer !== null && state?.longPressTimer !== undefined) {
      window.clearTimeout(state.longPressTimer);
    }
    pointersRef.current.delete(e.pointerId);
  }, []);

  return {
    svgRef,
    activeGlows,
    tappedPositions,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: releasePointer,
    handlePointerCancel: releasePointer,
  };
}
