import { create } from 'zustand';
import { ChordLibraryView } from './ChordLibraryView';
import { ProgressionFeatureView } from '../progression/ProgressionFeatureView';

type ChordSegment = 'library' | 'progression';

interface ChordTabState {
  segment: ChordSegment;
  setSegment: (s: ChordSegment) => void;
}

/** Non-persisted so it survives the コード tab unmounting on tab switch (SPEC §3.1 tab bar unmounts inactive tabs), but resets on full reload — acceptable since it's just a view toggle. */
const useChordTabStore = create<ChordTabState>((set) => ({
  segment: 'library',
  setSegment: (segment) => set({ segment }),
}));

/** SPEC §3.1: "コード" tab = コードライブラリ + コード進行プレイヤー(上部セグメントで切替). */
export function ChordTabView() {
  const segment = useChordTabStore((s) => s.segment);
  const setSegment = useChordTabStore((s) => s.setSegment);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 0, padding: '8px 16px 0' }}>
        <SegmentButton label="ライブラリ" active={segment === 'library'} onClick={() => setSegment('library')} side="left" />
        <SegmentButton label="進行" active={segment === 'progression'} onClick={() => setSegment('progression')} side="right" />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {segment === 'library' ? <ChordLibraryView /> : <ProgressionFeatureView />}
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
