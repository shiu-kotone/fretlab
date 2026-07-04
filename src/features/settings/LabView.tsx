import { create } from 'zustand';
import { SettingsPanel } from './SettingsPanel';
import { RecorderView } from '../recorder/RecorderView';

type LabSegment = 'recorder' | 'settings';

interface LabTabState {
  segment: LabSegment;
  setSegment: (s: LabSegment) => void;
}

/** Non-persisted so it survives the ラボ tab unmounting on tab switch, matching ChordTabView's pattern. */
const useLabTabStore = create<LabTabState>((set) => ({
  segment: 'recorder',
  setSegment: (segment) => set({ segment }),
}));

/** ラボ tab: SPEC §3.1 "録音・練習記録・設定" — 録音(§5.6) + 設定(§5.8) segments (記録/§5.7 to follow). */
export function LabView() {
  const segment = useLabTabStore((s) => s.segment);
  const setSegment = useLabTabStore((s) => s.setSegment);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 0, padding: '8px 16px 0' }}>
        <SegmentButton label="録音" active={segment === 'recorder'} onClick={() => setSegment('recorder')} side="left" />
        <SegmentButton label="設定" active={segment === 'settings'} onClick={() => setSegment('settings')} side="right" />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {segment === 'recorder' ? (
          <RecorderView />
        ) : (
          <div style={{ padding: '0 16px' }}>
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentButton({ label, active, onClick, side }: { label: string; active: boolean; onClick: () => void; side: 'left' | 'right' }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 40,
        border: '1px solid var(--line)',
        borderRadius: side === 'left' ? '8px 0 0 8px' : '0 8px 8px 0',
        borderRight: side === 'left' ? 'none' : undefined,
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? 'var(--bg)' : 'var(--string)',
        fontSize: 14,
      }}
    >
      {label}
    </button>
  );
}
