import { useMetronomeStore } from '../../stores/metronomeStore';
import { useMetronomeEngine } from './useMetronomeEngine';
import { AccentEditor } from './AccentEditor';
import { BpmControl } from './BpmControl';
import { TimeSignatureControl } from './TimeSignatureControl';
import { SubdivisionControl } from './SubdivisionControl';
import { ToneSelector } from './ToneSelector';
import { TrainerSettings } from './TrainerSettings';

export function MetronomeView() {
  const { isPlaying, flash, toggle } = useMetronomeEngine();
  const fullScreenFlash = useMetronomeStore((s) => s.fullScreenFlash);
  const setFullScreenFlash = useMetronomeStore((s) => s.setFullScreenFlash);
  const wakeLockEnabled = useMetronomeStore((s) => s.wakeLockEnabled);
  const setWakeLockEnabled = useMetronomeStore((s) => s.setWakeLockEnabled);

  const showFullFlash = fullScreenFlash && flash?.isMainBeat && flash.level !== 'mute';

  return (
    <div style={{ position: 'relative', paddingBottom: 32 }}>
      {showFullFlash && (
        <div
          key={flash?.key}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--accent)',
            opacity: 0.35,
            animation: 'metronome-flash 120ms ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      <AccentEditor flash={flash} />
      <BpmControl />
      <TimeSignatureControl />
      <SubdivisionControl />
      <ToneSelector />

      <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={toggle}
          style={{
            minWidth: 120,
            minHeight: 56,
            borderRadius: 28,
            border: 'none',
            background: isPlaying ? 'var(--warn)' : 'var(--accent)',
            color: 'var(--bg)',
            fontSize: 18,
            fontFamily: 'var(--font-display)',
          }}
        >
          {isPlaying ? '停止' : '再生'}
        </button>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>全画面フラッシュ(視覚メトロノーム)</span>
          <input
            type="checkbox"
            checked={fullScreenFlash}
            onChange={(e) => setFullScreenFlash(e.target.checked)}
          />
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>画面を消灯しない(再生中)</span>
          <input
            type="checkbox"
            checked={wakeLockEnabled}
            onChange={(e) => setWakeLockEnabled(e.target.checked)}
          />
        </label>
      </div>

      <TrainerSettings />
    </div>
  );
}
