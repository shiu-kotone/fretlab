import { useState } from 'react';
import { MicTunerPanel } from './MicTunerPanel';
import { ReferenceTonePanel } from './ReferenceTonePanel';
import { useActivityTimeTracker } from '../practiceLog/useActivityTimeTracker';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

type TunerMode = 'mic' | 'reference';

const MODES: { id: TunerMode; label: string }[] = [
  { id: 'mic', label: 'マイク' },
  { id: 'reference', label: '音出し' },
];

export function TunerView() {
  useActivityTimeTracker('tuner');
  const [mode, setMode] = useState<TunerMode>('mic');

  return (
    <div style={{ padding: '8px 16px 32px' }}>
      <div style={{ marginBottom: 8 }}>
        <SegmentedControl options={MODES} value={mode} onChange={setMode} aria-label="チューナーモード切替" />
      </div>

      {/* Switching modes unmounts the mic panel, which releases the microphone
          stream via its cleanup effect — the mic is only held while this mode
          is actually visible. */}
      {mode === 'mic' ? <MicTunerPanel /> : <ReferenceTonePanel />}
    </div>
  );
}
