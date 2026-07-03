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
import { unlockAudio, getAudioContext, setAudioSessionType } from '../../audio/AudioEngine';

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

export interface TunerDebugInfo {
  /** RMS level of the raw mic buffer, regardless of whether YIN found a pitch. */
  level: number;
  /** Raw (pre-smoothing, pre-confidence-gate) YIN result for this tick. */
  rawFrequency: number | null;
  rawConfidence: number;
}

export function useTunerEngine(tuning: Midi[], a4: number) {
  const [permissionState, setPermissionState] = useState<MicPermissionState>('idle');
  const [fixedStringIndex, setFixedStringIndex] = useState<number | null>(null);
  const [reading, setReading] = useState<TunerReading>(INITIAL_READING);
  const [lastError, setLastError] = useState<string | null>(null);
  const [debug, setDebug] = useState<TunerDebugInfo>({ level: 0, rawFrequency: null, rawConfidence: 0 });

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
    setDebug({ level: 0, rawFrequency: null, rawConfidence: 0 });
    // Hand the audio session back to 'playback' so metronome/guitar sound
    // resumes bypassing the silent switch once the mic is no longer needed.
    setAudioSessionType('playback');
  }, []);

  const tick = useCallback(() => {
    const capture = captureRef.current;
    if (!capture) return;
    const ctx = getAudioContext();
    const buffer = readTimeDomainData(capture.analyser);
    const { frequency, confidence } = yinDetectPitch(buffer, ctx.sampleRate);

    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
    const level = Math.sqrt(sumSq / buffer.length);
    setDebug({ level, rawFrequency: frequency, rawConfidence: confidence });

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
      // 'play-and-record': the 'playback' category set elsewhere in the app
      // is output-only and rejects getUserMedia with InvalidStateError.
      await unlockAudio({ audioSessionType: 'play-and-record' });
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

  return {
    permissionState,
    requestPermission,
    stopMic,
    reading,
    fixedStringIndex,
    setFixedStringIndex,
    lastError,
    debug,
  };
}
