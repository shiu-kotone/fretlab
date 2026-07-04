import { create } from 'zustand';
import { ChordLibraryView } from './ChordLibraryView';
import { ProgressionFeatureView } from '../progression/ProgressionFeatureView';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

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

const SEGMENTS: { id: ChordSegment; label: string }[] = [
  { id: 'library', label: 'ライブラリ' },
  { id: 'progression', label: '進行' },
];

/** SPEC §3.1: "コード" tab = コードライブラリ + コード進行プレイヤー(上部セグメントで切替). */
export function ChordTabView() {
  const segment = useChordTabStore((s) => s.segment);
  const setSegment = useChordTabStore((s) => s.setSegment);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 0' }}>
        <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} aria-label="コード表示切替" />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>{segment === 'library' ? <ChordLibraryView /> : <ProgressionFeatureView />}</div>
    </div>
  );
}
