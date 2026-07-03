export interface SpeedTrainerConfig {
  enabled: boolean;
  everyNBars: number;
  stepBpm: number;
  capBpm: number;
}

export interface MuteBarsConfig {
  enabled: boolean;
  playBars: number;
  muteBars: number;
}

/**
 * SPEC §5.4 Speed Trainer: every `everyNBars` completed bars, BPM increases by
 * `stepBpm`, capped at `capBpm` (then holds). `barIndex` is the 0-based bar
 * counter since playback started; the ramp is evaluated once at each bar's start.
 */
export function computeSpeedTrainerBpm(baseBpm: number, barIndex: number, config: SpeedTrainerConfig): number {
  if (!config.enabled || barIndex <= 0) return baseBpm;
  const steps = Math.floor(barIndex / config.everyNBars);
  return Math.min(config.capBpm, baseBpm + steps * config.stepBpm);
}

/**
 * SPEC §5.4 Mute Bars: plays `playBars` bars, then silently mutes `muteBars`
 * bars, repeating. `barIndex` is the 0-based bar counter since playback started.
 */
export function isBarMuted(barIndex: number, config: MuteBarsConfig): boolean {
  if (!config.enabled) return false;
  const cycleLength = config.playBars + config.muteBars;
  const posInCycle = barIndex % cycleLength;
  return posInCycle >= config.playBars;
}
