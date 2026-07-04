import { create } from 'zustand';
import { SettingsPanel } from './SettingsPanel';
import { RecorderView } from '../recorder/RecorderView';
import { PracticeLogView } from '../practiceLog/PracticeLogView';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

type LabSegment = 'recorder' | 'log' | 'settings';

interface LabTabState {
  segment: LabSegment;
  setSegment: (s: LabSegment) => void;
}

/**
 * Non-persisted so it survives the ラボ tab unmounting on tab switch, matching
 * ChordTabView's pattern. Exported so App.tsx's header can jump straight to
 * the 設定 segment (SPEC §5.8) instead of just switching to the ラボ tab and
 * landing on whatever segment was last open.
 */
export const useLabTabStore = create<LabTabState>((set) => ({
  segment: 'recorder',
  setSegment: (segment) => set({ segment }),
}));

const SEGMENTS: { id: LabSegment; label: string }[] = [
  { id: 'recorder', label: '録音' },
  { id: 'log', label: '記録' },
  { id: 'settings', label: '設定' },
];

/** ラボ tab: SPEC §3.1 "録音・練習記録・設定" — 録音(§5.6) / 記録(§5.7) / 設定(§5.8) segments. */
export function LabView() {
  const segment = useLabTabStore((s) => s.segment);
  const setSegment = useLabTabStore((s) => s.setSegment);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 0' }}>
        <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} aria-label="ラボ表示切替" />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {segment === 'recorder' && <RecorderView />}
        {segment === 'log' && <PracticeLogView />}
        {segment === 'settings' && (
          <div style={{ padding: '0 16px' }}>
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
