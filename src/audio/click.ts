export type ToneId = 'woodblock' | 'electronicClick' | 'beep' | 'cowbell' | 'rimshot';
export type ClickLevel = 'accent' | 'normal' | 'sub';

export const TONE_IDS: ToneId[] = ['woodblock', 'electronicClick', 'beep', 'cowbell', 'rimshot'];

interface OscillatorVoice {
  type: OscillatorType;
  frequency: number;
}

interface FilterSpec {
  type: BiquadFilterType;
  frequency: number;
  Q?: number;
}

interface OscillatorClickParams {
  kind: 'oscillator';
  voices: OscillatorVoice[];
  duration: number;
  gainPeak: number;
  filter?: FilterSpec;
}

interface NoiseClickParams {
  kind: 'noise';
  duration: number;
  gainPeak: number;
  filter: FilterSpec;
}

export type ClickParams = OscillatorClickParams | NoiseClickParams;

/**
 * Relative loudness for accent / normal (on-beat) / sub (subdivision tick) clicks.
 * Only the woodblock timbre has an explicit per-level pitch spec (SPEC §5.4); the
 * other four timbres reuse this amplitude scale for consistency (declared interpretation).
 */
const LEVEL_GAIN_SCALE: Record<ClickLevel, number> = {
  accent: 1.0,
  normal: 0.75,
  sub: 0.5,
};

export function getClickParams(tone: ToneId, level: ClickLevel): ClickParams {
  const scale = LEVEL_GAIN_SCALE[level];
  switch (tone) {
    case 'woodblock': {
      const freq = level === 'accent' ? 1600 : level === 'normal' ? 1100 : 800;
      return {
        kind: 'oscillator',
        voices: [
          { type: 'sine', frequency: freq },
          { type: 'triangle', frequency: freq },
        ],
        duration: 0.03,
        gainPeak: 0.9 * scale,
        filter: { type: 'bandpass', frequency: freq, Q: 6 },
      };
    }
    case 'electronicClick': {
      return {
        kind: 'oscillator',
        voices: [{ type: 'square', frequency: 1000 }],
        duration: level === 'sub' ? 0.004 : 0.006,
        gainPeak: 0.6 * scale,
      };
    }
    case 'beep': {
      const baseFreq = 880;
      // SPEC §5.4: accent beep sounds a perfect 5th above the base pitch.
      const freq = level === 'accent' ? baseFreq * Math.pow(2, 7 / 12) : baseFreq;
      return {
        kind: 'oscillator',
        voices: [{ type: 'sine', frequency: freq }],
        duration: 0.05,
        gainPeak: 0.8 * scale,
      };
    }
    case 'cowbell': {
      return {
        kind: 'oscillator',
        voices: [
          { type: 'square', frequency: 545 },
          { type: 'square', frequency: 800 },
        ],
        duration: level === 'sub' ? 0.05 : 0.08,
        gainPeak: 0.5 * scale,
      };
    }
    case 'rimshot': {
      return {
        kind: 'noise',
        duration: level === 'sub' ? 0.02 : 0.035,
        gainPeak: 0.7 * scale,
        filter: { type: 'highpass', frequency: level === 'accent' ? 2000 : 3000 },
      };
    }
  }
}

function createNoiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function applyFilter(ctx: BaseAudioContext, filter: FilterSpec | undefined, destination: AudioNode): AudioNode {
  if (!filter) return destination;
  const node = ctx.createBiquadFilter();
  node.type = filter.type;
  node.frequency.value = filter.frequency;
  if (filter.Q !== undefined) node.Q.value = filter.Q;
  node.connect(destination);
  return node;
}

/** Schedules one click sound at an absolute AudioContext time. Never uses setTimeout. */
export function synthesizeClick(
  ctx: BaseAudioContext,
  destination: AudioNode,
  time: number,
  tone: ToneId,
  level: ClickLevel,
): void {
  const params = getClickParams(tone, level);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(params.gainPeak, time + 0.001);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + params.duration);
  envelope.connect(destination);

  const stopTime = time + params.duration + 0.02;
  const input = applyFilter(ctx, params.filter, envelope);

  if (params.kind === 'oscillator') {
    const voiceGain = 1 / params.voices.length;
    for (const voice of params.voices) {
      const osc = ctx.createOscillator();
      osc.type = voice.type;
      osc.frequency.value = voice.frequency;
      const voiceNode = ctx.createGain();
      voiceNode.gain.value = voiceGain;
      osc.connect(voiceNode);
      voiceNode.connect(input);
      osc.start(time);
      osc.stop(stopTime);
    }
  } else {
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = createNoiseBuffer(ctx, params.duration + 0.02);
    bufferSource.connect(input);
    bufferSource.start(time);
    bufferSource.stop(stopTime);
  }
}
