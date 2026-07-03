import { useCallback, useEffect, useRef, useState } from 'react';
import { requestMicStream, createMicCapture, readTimeDomainData, type MicCapture } from '../../audio/micInput';
import { yinDetectPitch } from '../../audio/pitchDetect';
import { initialSmoothedPitchState, updateSmoothedPitch, type SmoothedPitchState } from '../../audio/tunerSmoothing';
import { freqToNearestNote, type Midi } from '../../theory/pitch';
import {
  centsFromMidi,
  isInTune,
  findNearestStringIndex,
  initialTuneHoldState,
  updateTuneHold,
} from '../../theory/tunerMath';
import { unlockAudio, getAudioContext } from '../../audio/AudioEngine';

/** SPEC §5.5 polling cadence: not tied to requestAnimationFrame, to bound CPU/battery use on iOS. */
const POLL_INTERVAL_MS = 50;

export type MicPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export interface TunerReading {
  displayedFrequency: number | null;
  midi: number | null;
  /** Cents relative to the nearest chromatic note (auto mode) or the fixed string's target (manual mode); unbounded. */
  cents: number;
  inTune: boolean;
  confirmed: boolean;
  nearestStringIndex: number | null;
}

const INITIAL_READING: TunerReading = {
  displayedFrequency: null,
  midi: null,
  cents: 0,
  inTune: false,
  confirmed: false,
  nearestStringIndex: null,
};

export function useTunerEngine(tuning: Midi[], a4: number) {
  const [permissionState, setPermissionState] = useState<MicPermissionState>('idle');
  const [fixedStringIndex, setFixedStringIndex] = useState<number | null>(null);
  const [reading, setReading] = useState<TunerReading>(INITIAL_READING);
  const [lastError, setLastError] = useState<string | null>(null);

  const captureRef = useRef<MicCapture | null>(null);
  const intervalRef = useRef<number | null>(null);
  const smoothedRef = useRef<SmoothedPitchState>(initialSmoothedPitchState());
  const holdRef = useRef(initialTuneHoldState());
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;
  const a4Ref = useRef(a4);
  a4Ref.current = a4;
  const fixedStringRef = useRef<number | null>(null);
  fixedStringRef.current = fixedStringIndex;

  const stopMic = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    captureRef.current?.stop();
    captureRef.current = null;
    smoothedRef.current = initialSmoothedPitchState();
    holdRef.current = initialTuneHoldState();
    setReading(INITIAL_READING);
  }, []);

  const tick = useCallback(() => {
    const capture = captureRef.current;
    if (!capture) return;
    const ctx = getAudioContext();
    const buffer = readTimeDomainData(capture.analyser);
    const { frequency } = yinDetectPitch(buffer, ctx.sampleRate);
    smoothedRef.current = updateSmoothedPitch(smoothedRef.current, frequency);
    const displayedFrequency = smoothedRef.current.displayedFrequency;
    if (displayedFrequency === null) return;

    const { midi, cents: nearestCents } = freqToNearestNote(displayedFrequency, a4Ref.current);
    const nearestStringIndex = findNearestStringIndex(midi, tuningRef.current);
    const fixed = fixedStringRef.current;
    const cents =
      fixed !== null ? centsFromMidi(displayedFrequency, tuningRef.current[fixed], a4Ref.current) : nearestCents;
    const inTune = isInTune(cents);
    const { state: nextHold, confirmed } = updateTuneHold(holdRef.current, inTune, performance.now());
    holdRef.current = nextHold;

    setReading({ displayedFrequency, midi, cents, inTune, confirmed, nearestStringIndex });
  }, []);

  const requestPermission = useCallback(async () => {
    setPermissionState('requesting');
    setLastError(null);
    try {
      await unlockAudio();
      const stream = await requestMicStream();
      captureRef.current = createMicCapture(stream);
      setPermissionState('granted');
      intervalRef.current = window.setInterval(tick, POLL_INTERVAL_MS);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : 'UnknownError';
      const message = err instanceof Error ? err.message : String(err);
      setLastError(`${name}: ${message}`);
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionState('denied');
      } else {
        setPermissionState('error');
      }
    }
  }, [tick]);

  useEffect(() => stopMic, [stopMic]);

  return { permissionState, requestPermission, stopMic, reading, fixedStringIndex, setFixedStringIndex, lastError };
}
