import { describe, it, expect } from 'vitest';
import { computeSpeedTrainerBpm, isBarMuted } from './trainer';

describe('computeSpeedTrainerBpm', () => {
  const config = { enabled: true, everyNBars: 4, stepBpm: 5, capBpm: 120 };

  it('returns the base BPM when disabled', () => {
    expect(computeSpeedTrainerBpm(100, 10, { ...config, enabled: false })).toBe(100);
  });

  it('returns the base BPM for the first bar', () => {
    expect(computeSpeedTrainerBpm(100, 0, config)).toBe(100);
  });

  it('holds base BPM until the first N-bar boundary is completed', () => {
    expect(computeSpeedTrainerBpm(100, 3, config)).toBe(100);
    expect(computeSpeedTrainerBpm(100, 4, config)).toBe(105);
  });

  it('steps up by stepBpm at every subsequent N-bar boundary', () => {
    expect(computeSpeedTrainerBpm(100, 8, config)).toBe(110);
    expect(computeSpeedTrainerBpm(100, 12, config)).toBe(115);
  });

  it('caps at capBpm and holds beyond it', () => {
    expect(computeSpeedTrainerBpm(100, 100, config)).toBe(120);
    expect(computeSpeedTrainerBpm(100, 1000, config)).toBe(120);
  });
});

describe('isBarMuted', () => {
  const config = { enabled: true, playBars: 2, muteBars: 3 };

  it('is never muted when disabled', () => {
    expect(isBarMuted(5, { ...config, enabled: false })).toBe(false);
  });

  it('plays the first `playBars` bars of each cycle', () => {
    expect(isBarMuted(0, config)).toBe(false);
    expect(isBarMuted(1, config)).toBe(false);
  });

  it('mutes the following `muteBars` bars of each cycle', () => {
    expect(isBarMuted(2, config)).toBe(true);
    expect(isBarMuted(3, config)).toBe(true);
    expect(isBarMuted(4, config)).toBe(true);
  });

  it('repeats the play/mute cycle indefinitely', () => {
    expect(isBarMuted(5, config)).toBe(false); // bar 5 = start of 2nd cycle
    expect(isBarMuted(6, config)).toBe(false);
    expect(isBarMuted(7, config)).toBe(true);
  });
});
