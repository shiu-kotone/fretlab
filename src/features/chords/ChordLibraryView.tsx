import { useMemo, useState } from 'react';
import { ChordDiagram } from './ChordDiagram';
import { useChordPlayback } from './useChordPlayback';
import { useChordLibraryStore, isFavoriteChord } from '../../stores/chordLibraryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useFretboardStore } from '../../stores/fretboardStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { getVoicingsForChord } from '../../data/chordLibrary';
import { CHORD_TYPES, type ChordGroup, type ChordTypeId } from '../../theory/chords';
import { parseChordSymbol } from '../../theory/chordParser';
import { noteName } from '../../theory/pitch';
import { isRegularTuning } from '../../theory/tuningResolver';
import { useActivityTimeTracker } from '../practiceLog/useActivityTimeTracker';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

const ROOT_PITCH_CLASSES = Array.from({ length: 12 }, (_, i) => i);
const GROUP_OPTIONS: { id: ChordGroup; label: string }[] = [
  { id: 'basic', label: '基本' },
  { id: 'seventh', label: 'セブンス' },
  { id: 'tension', label: 'テンション' },
  { id: 'other', label: 'その他' },
];

export function ChordLibraryView() {
  // The コード tab stays mounted in the background (SPEC §3.1, progression
  // playback continuity), so this must only accrue time while that tab is
  // actually the one on screen — not whenever this component happens to be mounted.
  const isChordsTabActive = useNavigationStore((s) => s.activeTab === 'chords');
  useActivityTimeTracker('chords', isChordsTabActive);
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);

  const selectedRoot = useChordLibraryStore((s) => s.selectedRoot);
  const setSelectedRoot = useChordLibraryStore((s) => s.setSelectedRoot);
  const selectedType = useChordLibraryStore((s) => s.selectedType);
  const setSelectedType = useChordLibraryStore((s) => s.setSelectedType);
  const selectedVoicingIndex = useChordLibraryStore((s) => s.selectedVoicingIndex);
  const setSelectedVoicingIndex = useChordLibraryStore((s) => s.setSelectedVoicingIndex);
  const favorites = useChordLibraryStore((s) => s.favorites);
  const toggleFavorite = useChordLibraryStore((s) => s.toggleFavorite);
  const showFavoritesOnly = useChordLibraryStore((s) => s.showFavoritesOnly);
  const setShowFavoritesOnly = useChordLibraryStore((s) => s.setShowFavoritesOnly);

  const setDegreeRoot = useFretboardStore((s) => s.setDegreeRoot);
  const setDegreesFromPreset = useFretboardStore((s) => s.setDegreesFromPreset);
  const setOverlayMode = useFretboardStore((s) => s.setOverlayMode);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  const { strum, arpeggio } = useChordPlayback();

  const [searchText, setSearchText] = useState('');
  const [activeGroup, setActiveGroup] = useState<ChordGroup>(CHORD_TYPES.find((t) => t.id === selectedType)?.group ?? 'basic');

  const voicings = useMemo(() => getVoicingsForChord(selectedRoot, selectedType), [selectedRoot, selectedType]);
  const voicingIndex = Math.min(selectedVoicingIndex, Math.max(0, voicings.length - 1));
  const voicing = voicings[voicingIndex];

  const currentTypeDef = CHORD_TYPES.find((t) => t.id === selectedType)!;
  const chordName = `${noteName(60 + selectedRoot, noteNaming).replace(/\d+$/, '')}${currentTypeDef.symbol}`;

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    const parsed = parseChordSymbol(value);
    if (parsed) {
      setSelectedRoot(parsed.root);
      setSelectedType(parsed.type as ChordTypeId);
      const group = CHORD_TYPES.find((t) => t.id === parsed.type)?.group;
      if (group) setActiveGroup(group);
    }
  };

  const goToFretboard = () => {
    const rootMidi = 60 + selectedRoot;
    setDegreeRoot(rootMidi);
    setDegreesFromPreset(currentTypeDef.intervals);
    setOverlayMode('degree');
    setActiveTab('fretboard');
  };

  if (showFavoritesOnly) {
    return (
      <div style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--string)' }}>お気に入り</h2>
          <Button variant="primary" onClick={() => setShowFavoritesOnly(false)}>
            ★ 一覧を閉じる
          </Button>
        </div>
        {favorites.length === 0 && <p style={{ color: 'var(--line)' }}>お気に入りはまだありません。</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favorites.map((fav) => {
            const def = CHORD_TYPES.find((t) => t.id === fav.typeId);
            if (!def) return null;
            const name = `${noteName(60 + fav.root, noteNaming).replace(/\d+$/, '')}${def.symbol}`;
            return (
              <Button
                key={`${fav.root}-${fav.typeId}-${fav.voicingIndex}`}
                onClick={() => {
                  setSelectedRoot(fav.root);
                  setSelectedType(fav.typeId);
                  setSelectedVoicingIndex(fav.voicingIndex);
                  setActiveGroup(def.group);
                  setShowFavoritesOnly(false);
                }}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                {name}({fav.voicingIndex + 1})
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="コード検索 (例: C#m7b5)"
          style={searchInputStyle}
        />
        <Button onClick={() => setShowFavoritesOnly(true)} aria-label="お気に入り一覧">
          ★
        </Button>
      </div>

      {!isRegularTuning(currentTuningId) && (
        <p style={{ fontSize: 11, color: 'var(--warn)', margin: 0 }}>ダイアグラムはレギュラー基準です(§4.2)。</p>
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {ROOT_PITCH_CLASSES.map((pc) => (
          <Chip key={pc} active={selectedRoot === pc} onClick={() => setSelectedRoot(pc)}>
            {noteName(60 + pc, noteNaming).replace(/\d+$/, '')}
          </Chip>
        ))}
      </div>

      {/* Type selection collapsed to a group switch + one chip row (POLISH.md R2-7) — the
          previous 4 stacked rows pushed the diagram/play controls off the initial screen. */}
      <SegmentedControl options={GROUP_OPTIONS} value={activeGroup} onChange={setActiveGroup} aria-label="コードタイプのグループ" />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {CHORD_TYPES.filter((t) => t.group === activeGroup).map((t) => (
          <Chip key={t.id} active={selectedType === t.id} onClick={() => setSelectedType(t.id)}>
            {t.symbol || 'maj'}
          </Chip>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="tabular-nums" style={{ fontSize: 40, color: 'var(--accent)' }}>
          {chordName}
        </div>
      </div>

      {voicing ? (
        <>
          <ChordDiagram voicing={voicing} root={selectedRoot} typeId={selectedType} noteNaming={noteNaming} leftHanded={leftHanded} />

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {voicings.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedVoicingIndex(i)}
                aria-label={`ボイシング${i + 1}`}
                style={{
                  width: 44,
                  height: 44,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: i === voicingIndex ? 'var(--accent)' : 'var(--line)',
                  }}
                />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Button onClick={() => setSelectedVoicingIndex(Math.max(0, voicingIndex - 1))} disabled={voicingIndex === 0}>
              ← 前
            </Button>
            <Button onClick={() => setSelectedVoicingIndex(Math.min(voicings.length - 1, voicingIndex + 1))} disabled={voicingIndex === voicings.length - 1}>
              次 →
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => strum(voicing)} className="btn btn-primary" style={playButtonStyle}>
              ストラム
            </button>
            <button onClick={() => arpeggio(voicing)} className="btn btn-primary" style={playButtonStyle}>
              アルペジオ
            </button>
            <Button onClick={() => toggleFavorite(selectedRoot, selectedType, voicingIndex)} aria-label="お気に入り切り替え" variant={isFavoriteChord(favorites, selectedRoot, selectedType, voicingIndex) ? 'primary' : 'secondary'}>
              ★
            </Button>
          </div>

          <Button onClick={goToFretboard} style={{ alignSelf: 'center' }}>
            指板で見る
          </Button>
        </>
      ) : (
        <p style={{ color: 'var(--line)', textAlign: 'center' }}>このコードのボイシングが見つかりませんでした。</p>
      )}
    </div>
  );
}

const playButtonStyle = {
  minHeight: 48,
  padding: '0 18px',
  borderRadius: 24,
  fontSize: 14,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
};

const searchInputStyle = {
  flex: 1,
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
  fontSize: 14,
};
