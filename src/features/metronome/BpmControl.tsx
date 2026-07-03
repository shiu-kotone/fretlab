import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { useMetronomeStore } from '../../stores/metronomeStore';
import { initialTapTempoState, registerTap, type TapTempoState } from '../../audio/tapTempo';

const LONG_PRESS_INITIAL_DELAY_MS = 400;
const LONG_PRESS_REPEAT_MS = 90;

export function BpmControl() {
  const bpm = useMetronomeStore((s) => s.bpm);
  const setBpm = useMetronomeStore((s) => s.setBpm);

  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const tapStateRef = useRef<TapTempoState>(initialTapTempoState());
  const [tapFlash, setTapFlash] = useState(false);

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current !== null) window.clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current !== null) window.clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      useMetronomeStore.getState().setBpm(useMetronomeStore.getState().bpm + delta);
      holdTimeoutRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          useMetronomeStore.getState().setBpm(useMetronomeStore.getState().bpm + delta);
        }, LONG_PRESS_REPEAT_MS);
      }, LONG_PRESS_INITIAL_DELAY_MS);
    },
    [],
  );

  const handleTap = useCallback(() => {
    const { state, bpm: derivedBpm } = registerTap(tapStateRef.current, performance.now());
    tapStateRef.current = state;
    if (derivedBpm !== null) {
      setBpm(derivedBpm);
    }
    setTapFlash(true);
    window.setTimeout(() => setTapFlash(false), 100);
  }, [setBpm]);

  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <span className="tabular-nums" style={{ fontSize: 56, color: 'var(--accent)', lineHeight: 1 }}>
          {bpm}
        </span>
        <span style={{ fontSize: 16, marginLeft: 6, color: 'var(--string)' }}>BPM</span>
      </div>

      <input
        type="range"
        min={20}
        max={300}
        step={1}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="BPMスライダー"
        style={{ width: '100%' }}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        <button
          aria-label="BPMを下げる"
          onPointerDown={() => startHold(-1)}
          onPointerUp={clearHold}
          onPointerLeave={clearHold}
          onPointerCancel={clearHold}
          style={roundButtonStyle}
        >
          −
        </button>
        <button
          onClick={handleTap}
          aria-label="タップテンポ"
          style={{
            ...roundButtonStyle,
            width: 88,
            borderRadius: 22,
            background: tapFlash ? 'var(--accent)' : 'var(--surface)',
            color: tapFlash ? 'var(--bg)' : 'var(--string)',
          }}
        >
          TAP
        </button>
        <button
          aria-label="BPMを上げる"
          onPointerDown={() => startHold(1)}
          onPointerUp={clearHold}
          onPointerLeave={clearHold}
          onPointerCancel={clearHold}
          style={roundButtonStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}

const roundButtonStyle: CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  borderRadius: 22,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
  fontSize: 20,
};
