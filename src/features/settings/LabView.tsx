import { create } from 'zustand';
import { SettingsPanel } from './SettingsPanel';
import { RecorderView } from '../recorder/RecorderView';
import { PracticeLogView } from '../practiceLog/PracticeLogView';

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
      <div style={{ display: 'flex', gap: 0, padding: '8px 16px 0' }}>
        {SEGMENTS.map((s, i) => (
          <SegmentButton
            key={s.id}
            label={s.label}
            active={segment === s.id}
            onClick={() => setSegment(s.id)}
            side={i === 0 ? 'left' : i === SEGMENTS.length - 1 ? 'right' : 'middle'}
          />
        ))}
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

function SegmentButton({
  label,
  active,
  onClick,
  side,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  side: 'left' | 'middle' | 'right';
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 40,
        border: '1px solid var(--line)',
        borderRadius: side === 'left' ? '8px 0 0 8px' : side === 'right' ? '0 8px 8px 0' : 0,
        borderRight: side === 'right' ? undefined : 'none',
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? 'var(--bg)' : 'var(--string)',
        fontSize: 14,
      }}
    >
      {label}
    </button>
  );
}
