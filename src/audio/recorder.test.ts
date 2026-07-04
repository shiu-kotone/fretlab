import { describe, it, expect } from 'vitest';
import { pickRecorderMimeType, defaultRecordingName, formatDuration, formatFileSize, MAX_RECORDING_SECONDS } from './recorder';

describe('pickRecorderMimeType', () => {
  it('prefers audio/mp4 when supported (SPEC §5.6 fallback order)', () => {
    expect(pickRecorderMimeType((t) => t === 'audio/mp4' || t === 'audio/webm')).toBe('audio/mp4');
  });

  it('falls back to audio/webm when mp4 is unsupported', () => {
    expect(pickRecorderMimeType((t) => t === 'audio/webm')).toBe('audio/webm');
  });

  it('returns null when neither is supported', () => {
    expect(pickRecorderMimeType(() => false)).toBeNull();
  });
});

describe('defaultRecordingName', () => {
  it('formats as "録音 YYYY-MM-DD HH:mm"', () => {
    const date = new Date(2026, 6, 4, 9, 5); // 2026-07-04 09:05 (month is 0-based)
    expect(defaultRecordingName(date)).toBe('録音 2026-07-04 09:05');
  });
});

describe('formatDuration', () => {
  it('formats seconds under a minute', () => {
    expect(formatDuration(5)).toBe('0:05');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('formats up to the 30-minute cap', () => {
    expect(formatDuration(MAX_RECORDING_SECONDS)).toBe('30:00');
  });

  it('rounds fractional seconds', () => {
    expect(formatDuration(59.6)).toBe('1:00');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0KB');
    expect(formatFileSize(20 * 1024)).toBe('20KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0MB');
  });
});
