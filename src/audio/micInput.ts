import { getAudioContext } from './AudioEngine';

/** SPEC §5.5: 4096-sample analysis buffer. */
export const ANALYSER_FFT_SIZE = 4096;

/**
 * SPEC §5.5: exact getUserMedia constraints — the browser's own AGC/noise
 * suppression/echo cancellation would distort the signal YIN needs to see.
 */
export async function requestMicStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
}

export interface MicCapture {
  analyser: AnalyserNode;
  stream: MediaStream;
  stop: () => void;
}

/** Taps the mic stream into an AnalyserNode for pitch analysis; never connects to destination (no monitoring loop). */
export function createMicCapture(stream: MediaStream): MicCapture {
  const ctx = getAudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = ANALYSER_FFT_SIZE;
  source.connect(analyser);

  const stop = () => {
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
  };

  return { analyser, stream, stop };
}

export function readTimeDomainData(analyser: AnalyserNode): Float32Array {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  return buffer;
}
