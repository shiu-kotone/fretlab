import { useState } from 'react';
import { MicTunerPanel } from './MicTunerPanel';
import { ReferenceTonePanel } from './ReferenceTonePanel';

type TunerMode = 'mic' | 'reference';

export function TunerView() {
  const [mode, setMode] = useState<TunerMode>('mic');

  return (
    <div style={{ padding: '8px 16px 32px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setMode('mic')} style={segmentStyle(mode === 'mic')}>
          マイク
        </button>
        <button onClick={() => setMode('reference')} style={segmentStyle(mode === 'reference')}>
          音出し
        </button>
      </div>

      {/* Switching modes unmounts the mic panel, which releases the microphone
          stream via its cleanup effect — the mic is only held while this mode
          is actually visible. */}
      {mode === 'mic' ? <MicTunerPanel /> : <ReferenceTonePanel />}
    </div>
  );
}

function segmentStyle(active: boolean) {
  return {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--string)',
  };
}
