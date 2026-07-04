import { useCallback, useEffect, useRef, useState } from 'react';
import { requestMicStream, createMicCapture, readTimeDomainData, type MicCapture } from '../../audio/micInput';
import { pickRecorderMimeType, defaultRecordingName, MAX_RECORDING_SECONDS } from '../../audio/recorder';
import { unlockAudio, setAudioSessionType } from '../../audio/AudioEngine';
import { useRecordingsStore } from '../../stores/recordingsStore';

export type RecorderPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

const LEVEL_POLL_MS = 100;
const ELAPSED_POLL_MS = 250;

/**
 * SPEC §5.6: MediaRecorder-based recording with a live level meter + elapsed
 * time, a 30-minute auto-stop, and auto-save to IndexedDB on stop. Reuses the
 * tuner's mic capture path (SPEC §4.4 'play-and-record' audio session) rather
 * than opening a second getUserMedia stream type.
 */
export function useRecorderEngine() {
  const [permissionState, setPermissionState] = useState<RecorderPermissionState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const captureRef = useRef<MicCapture | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const levelIntervalRef = useRef<number | null>(null);
  const elapsedIntervalRef = useRef<number | null>(null);

  const addRecording = useRecordingsStore((s) => s.add);

  const cleanupMic = useCallback(() => {
    if (levelIntervalRef.current !== null) {
      window.clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    if (elapsedIntervalRef.current !== null) {
      window.clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    captureRef.current?.stop();
    captureRef.current = null;
    setLevel(0);
    // Hand the audio session back to 'playback' so metronome/guitar sound resumes bypassing the silent switch.
    setAudioSessionType('playback');
  }, []);

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    const mimeType = recorder.mimeType || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
    recorderRef.current = null;
    setIsRecording(false);
    cleanupMic();
    if (blob.size > 0) {
      await addRecording({ name: defaultRecordingName(new Date()), blob, mimeType, durationSeconds });
    }
  }, [addRecording, cleanupMic]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop(); // 'stop' event fires finishRecording, once the browser flushes the final chunk
  }, []);

  const start = useCallback(async () => {
    setLastError(null);
    setPermissionState('requesting');
    try {
      await unlockAudio({ audioSessionType: 'play-and-record' });
      const mimeType = pickRecorderMimeType((t) => (typeof MediaRecorder !== 'undefined' ? MediaRecorder.isTypeSupported(t) : false));
      if (!mimeType) throw new Error('この端末では対応する録音フォーマットが見つかりません');

      const stream = await requestMicStream();
      captureRef.current = createMicCapture(stream);
      setPermissionState('granted');

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void finishRecording();
      };
      recorderRef.current = recorder;
      startTimeRef.current = performance.now();
      setElapsedSeconds(0);
      recorder.start();
      setIsRecording(true);

      levelIntervalRef.current = window.setInterval(() => {
        const capture = captureRef.current;
        if (!capture) return;
        const buffer = readTimeDomainData(capture.analyser);
        let sumSq = 0;
        for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
        setLevel(Math.sqrt(sumSq / buffer.length));
      }, LEVEL_POLL_MS);

      elapsedIntervalRef.current = window.setInterval(() => {
        const seconds = (performance.now() - startTimeRef.current) / 1000;
        setElapsedSeconds(seconds);
        if (seconds >= MAX_RECORDING_SECONDS) stop();
      }, ELAPSED_POLL_MS);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : 'UnknownError';
      const message = err instanceof Error ? err.message : String(err);
      setLastError(`${name}: ${message}`);
      setPermissionState(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error');
      cleanupMic();
    }
  }, [cleanupMic, finishRecording, stop]);

  useEffect(
    () => () => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      cleanupMic();
    },
    [cleanupMic],
  );

  return { permissionState, isRecording, elapsedSeconds, level, lastError, start, stop };
}
