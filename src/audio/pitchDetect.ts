/**
 * YIN pitch detection (SPEC §5.5): difference function → cumulative mean
 * normalized difference function (CMNDF) → absolute threshold → parabolic
 * interpolation. Pure and buffer-in/result-out so it's testable without a
 * real microphone or AudioContext.
 */

export interface YinOptions {
  /** Absolute threshold on the CMNDF; SPEC §5.5 specifies 0.1-0.15. */
  threshold?: number;
  /** SPEC §5.5 detection range floor: E1 ≈ 41Hz. */
  minFrequency?: number;
  /** SPEC §5.5 detection range ceiling: E6 ≈ 1319Hz. */
  maxFrequency?: number;
}

export interface YinResult {
  /** Detected fundamental frequency in Hz, or null if no period passed the threshold. */
  frequency: number | null;
  /** 1 - CMNDF at the chosen lag; higher is more confident. 0 when frequency is null. */
  confidence: number;
}

const DEFAULT_THRESHOLD = 0.12;
const DEFAULT_MIN_FREQUENCY = 41;
const DEFAULT_MAX_FREQUENCY = 1319;

function differenceFunction(buffer: Float32Array, maxTau: number): Float32Array {
  const diff = new Float32Array(maxTau + 1);
  const windowSize = buffer.length - maxTau;
  for (let tau = 0; tau <= maxTau; tau++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      const delta = buffer[j] - buffer[j + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }
  return diff;
}

function cumulativeMeanNormalizedDifference(diff: Float32Array): Float32Array {
  const cmnd = new Float32Array(diff.length);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < diff.length; tau++) {
    runningSum += diff[tau];
    cmnd[tau] = runningSum === 0 ? 1 : (diff[tau] * tau) / runningSum;
  }
  return cmnd;
}

/** Parabolic interpolation around index `tau` using its two neighbors, for sub-sample precision. */
function parabolicInterpolate(cmnd: Float32Array, tau: number): number {
  const x0 = tau > 0 ? tau - 1 : tau;
  const x2 = tau + 1 < cmnd.length ? tau + 1 : tau;
  if (x0 === tau) return cmnd[tau] <= cmnd[x2] ? tau : x2;
  if (x2 === tau) return cmnd[tau] <= cmnd[x0] ? tau : x0;

  const s0 = cmnd[x0];
  const s1 = cmnd[tau];
  const s2 = cmnd[x2];
  const denom = s0 - 2 * s1 + s2;
  if (denom === 0) return tau;
  return tau + (s0 - s2) / (2 * denom);
}

export function yinDetectPitch(buffer: Float32Array, sampleRate: number, opts: YinOptions = {}): YinResult {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const minFrequency = opts.minFrequency ?? DEFAULT_MIN_FREQUENCY;
  const maxFrequency = opts.maxFrequency ?? DEFAULT_MAX_FREQUENCY;

  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxTau = Math.min(Math.floor(buffer.length / 2), Math.ceil(sampleRate / minFrequency));

  if (maxTau <= minTau) {
    return { frequency: null, confidence: 0 };
  }

  const diff = differenceFunction(buffer, maxTau);
  const cmnd = cumulativeMeanNormalizedDifference(diff);

  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    return { frequency: null, confidence: 0 };
  }

  const betterTau = parabolicInterpolate(cmnd, tauEstimate);
  if (betterTau <= 0) {
    return { frequency: null, confidence: 0 };
  }

  const frequency = sampleRate / betterTau;
  const confidence = Math.max(0, 1 - cmnd[tauEstimate]);
  return { frequency, confidence };
}
