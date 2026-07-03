import { describe, it, expect } from 'vitest';
import { yinDetectPitch } from './pitchDetect';

const SAMPLE_RATE = 44100;
const BUFFER_LENGTH = 4096;

function generateSineBuffer(frequency: number, sampleRate: number, length: number, amplitude = 0.8): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buffer;
}

function centsError(detected: number, expected: number): number {
  return Math.abs(1200 * Math.log2(detected / expected));
}

describe('yinDetectPitch', () => {
  it('detects standard-tuning guitar open-string frequencies within 3 cents', () => {
    // E2 A2 D3 G3 B3 E4
    const frequencies = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
    for (const freq of frequencies) {
      const buffer = generateSineBuffer(freq, SAMPLE_RATE, BUFFER_LENGTH);
      const result = yinDetectPitch(buffer, SAMPLE_RATE);
      expect(result.frequency).not.toBeNull();
      expect(centsError(result.frequency!, freq)).toBeLessThan(3);
    }
  });

  it('detects A4 = 440Hz precisely', () => {
    const buffer = generateSineBuffer(440, SAMPLE_RATE, BUFFER_LENGTH);
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.frequency).not.toBeNull();
    expect(centsError(result.frequency!, 440)).toBeLessThan(2);
  });

  it('detects near the SPEC §5.5 lower bound (E1 ≈ 41Hz)', () => {
    const buffer = generateSineBuffer(41.2, SAMPLE_RATE, BUFFER_LENGTH);
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.frequency).not.toBeNull();
    expect(centsError(result.frequency!, 41.2)).toBeLessThan(5);
  });

  it('detects near the SPEC §5.5 upper bound (E6 ≈ 1319Hz)', () => {
    const buffer = generateSineBuffer(1318.5, SAMPLE_RATE, BUFFER_LENGTH);
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.frequency).not.toBeNull();
    expect(centsError(result.frequency!, 1318.5)).toBeLessThan(5);
  });

  it('reports high confidence for a clean sine tone', () => {
    const buffer = generateSineBuffer(220, SAMPLE_RATE, BUFFER_LENGTH);
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('returns null frequency and zero confidence for silence', () => {
    const buffer = new Float32Array(BUFFER_LENGTH); // all zeros
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.frequency).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('returns null frequency for pure white noise (no stable period)', () => {
    let seed = 42;
    const pseudoRandom = () => {
      // deterministic LCG so the test isn't flaky
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const buffer = new Float32Array(BUFFER_LENGTH);
    for (let i = 0; i < BUFFER_LENGTH; i++) buffer[i] = pseudoRandom();
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.frequency).toBeNull();
  });

  it('respects a custom threshold/frequency-range option', () => {
    const buffer = generateSineBuffer(300, SAMPLE_RATE, BUFFER_LENGTH);
    // exclude 300Hz from the search range entirely
    const result = yinDetectPitch(buffer, SAMPLE_RATE, { minFrequency: 400, maxFrequency: 1000 });
    expect(result.frequency).toBeNull();
  });

  it('tolerates a fundamental plus a weaker harmonic without octave error', () => {
    const fundamental = 196.0; // G3
    const buffer = new Float32Array(BUFFER_LENGTH);
    for (let i = 0; i < BUFFER_LENGTH; i++) {
      const t = i / SAMPLE_RATE;
      buffer[i] = 0.8 * Math.sin(2 * Math.PI * fundamental * t) + 0.2 * Math.sin(2 * Math.PI * fundamental * 2 * t);
    }
    const result = yinDetectPitch(buffer, SAMPLE_RATE);
    expect(result.frequency).not.toBeNull();
    expect(centsError(result.frequency!, fundamental)).toBeLessThan(5);
  });
});
