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

/** Taps the mic stream into an AnalyserNode for pitch analysis. */
export function createMicCapture(stream: MediaStream): MicCapture {
  const ctx = getAudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = ANALYSER_FFT_SIZE;
  source.connect(analyser);

  // Some engines (notably iOS Safari) only keep pulling fresh data through a
  // node that's part of a graph reaching the destination; an AnalyserNode
  // with no path to destination can silently stop updating — no error, it
  // just always returns stale/zeroed data. Route through a silent (gain 0)
  // node so the graph is always driven, without audibly monitoring the mic.
  const silentSink = ctx.createGain();
  silentSink.gain.value = 0;
  analyser.connect(silentSink);
  silentSink.connect(ctx.destination);

  const stop = () => {
    source.disconnect();
    analyser.disconnect();
    silentSink.disconnect();
    stream.getTracks().forEach((track) => track.stop());
  };

  return { analyser, stream, stop };
}

export function readTimeDomainData(analyser: AnalyserNode): Float32Array {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  return buffer;
}
