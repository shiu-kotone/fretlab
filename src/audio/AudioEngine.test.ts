import { describe, it, expect, beforeAll } from 'vitest';

/**
 * jsdom doesn't implement the Web Audio API, so AudioEngine's real
 * getAudioContext() has nothing to construct against. This stubs just enough
 * of the AudioContext/GainNode/DynamicsCompressorNode surface for
 * getAudioContext() to run its one-time graph setup, so
 * resumeAudioContextIfNeeded()'s actual behavior (POLISH.md R4-2) — resuming
 * only when the shared context is suspended — is exercised for real instead
 * of only reasoned about.
 */
class FakeGainNode {
  gain = { value: 1 };
  connect(): void {}
}

class FakeDynamicsCompressorNode {
  threshold = { value: 0 };
  knee = { value: 0 };
  ratio = { value: 0 };
  attack = { value: 0 };
  release = { value: 0 };
  connect(): void {}
}

class FakeAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'suspended';
  destination = {};
  resumeCalls = 0;
  createGain(): FakeGainNode {
    return new FakeGainNode();
  }
  createDynamicsCompressor(): FakeDynamicsCompressorNode {
    return new FakeDynamicsCompressorNode();
  }
  resume(): Promise<void> {
    this.resumeCalls++;
    this.state = 'running';
    return Promise.resolve();
  }
}

beforeAll(() => {
  (window as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext;
});

describe('resumeAudioContextIfNeeded', () => {
  it('resumes the shared context when it is suspended', async () => {
    const { getAudioContext, resumeAudioContextIfNeeded } = await import('./AudioEngine');
    const ctx = getAudioContext() as unknown as FakeAudioContext;
    expect(ctx.state).toBe('suspended');

    await resumeAudioContextIfNeeded();

    expect(ctx.state).toBe('running');
    expect(ctx.resumeCalls).toBe(1);
  });

  it('is a no-op once the context is already running', async () => {
    const { getAudioContext, resumeAudioContextIfNeeded } = await import('./AudioEngine');
    const ctx = getAudioContext() as unknown as FakeAudioContext;
    ctx.state = 'running';
    const callsBefore = ctx.resumeCalls;

    await resumeAudioContextIfNeeded();

    expect(ctx.resumeCalls).toBe(callsBefore);
  });
});
