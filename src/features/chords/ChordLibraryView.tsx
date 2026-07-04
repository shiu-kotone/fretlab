import { useMemo, useRef, useState, type PointerEvent } from 'react';
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

const ROOT_PITCH_CLASSES = Array.from({ length: 12 }, (_, i) => i);
const GROUP_LABELS: Record<ChordGroup, string> = {
  basic: '基本',
  seventh: 'セブンス',
  tension: 'テンション',
  other: 'その他',
};
const GROUPS: ChordGroup[] = ['basic', 'seventh', 'tension', 'other'];
const LONG_PRESS_MS = 400;

export function ChordLibraryView() {
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
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

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
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePlayPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    // Pointer capture keeps this element receiving the up/cancel events even
    // if the finger drifts slightly during the hold — without it, a real
    // touchscreen tap can be reinterpreted as a scroll gesture inside the
    // scrollable page and the button never sees a pointerup at all.
    e.currentTarget.setPointerCapture(e.pointerId);
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      arpeggio(voicing);
    }, LONG_PRESS_MS);
  };

  const handlePlayPointerUp = () => {
    clearLongPressTimer();
    if (!longPressFired.current) {
      strum(voicing);
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
          <button onClick={() => setShowFavoritesOnly(false)} style={toolbarButtonStyle(true)}>
            ★ 一覧を閉じる
          </button>
        </div>
        {favorites.length === 0 && <p style={{ color: 'var(--line)' }}>お気に入りはまだありません。</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favorites.map((fav) => {
            const def = CHORD_TYPES.find((t) => t.id === fav.typeId);
            if (!def) return null;
            const name = `${noteName(60 + fav.root, noteNaming).replace(/\d+$/, '')}${def.symbol}`;
            return (
              <button
                key={`${fav.root}-${fav.typeId}-${fav.voicingIndex}`}
                onClick={() => {
                  setSelectedRoot(fav.root);
                  setSelectedType(fav.typeId);
                  setSelectedVoicingIndex(fav.voicingIndex);
                  setShowFavoritesOnly(false);
                }}
                style={{ ...toolbarButtonStyle(false), textAlign: 'left', justifyContent: 'flex-start' }}
              >
                {name}({fav.voicingIndex + 1})
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="コード検索 (例: C#m7b5)"
          style={searchInputStyle}
        />
        <button onClick={() => setShowFavoritesOnly(true)} style={toolbarButtonStyle(false)} aria-label="お気に入り一覧">
          ★
        </button>
      </div>

      {!isRegularTuning(currentTuningId) && (
        <p style={{ fontSize: 11, color: 'var(--warn)', margin: 0 }}>ダイアグラムはレギュラー基準です(§4.2)。</p>
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {ROOT_PITCH_CLASSES.map((pc) => (
          <button key={pc} onClick={() => setSelectedRoot(pc)} style={toolbarButtonStyle(selectedRoot === pc)}>
            {noteName(60 + pc, noteNaming).replace(/\d+$/, '')}
          </button>
        ))}
      </div>

      {GROUPS.map((group) => (
        <div key={group} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--line)', flexShrink: 0, alignSelf: 'center', minWidth: 48 }}>
            {GROUP_LABELS[group]}
          </span>
          {CHORD_TYPES.filter((t) => t.group === group).map((t) => (
            <button key={t.id} onClick={() => setSelectedType(t.id)} style={toolbarButtonStyle(selectedType === t.id)}>
              {t.symbol || 'maj'}
            </button>
          ))}
        </div>
      ))}

      <div style={{ textAlign: 'center' }}>
        <div className="tabular-nums" style={{ fontSize: 40, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          {chordName}
        </div>
      </div>

      {voicing ? (
        <>
          <ChordDiagram voicing={voicing} root={selectedRoot} typeId={selectedType} noteNaming={noteNaming} leftHanded={leftHanded} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {voicings.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedVoicingIndex(i)}
                aria-label={`ボイシング${i + 1}`}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: 'none',
                  background: i === voicingIndex ? 'var(--accent)' : 'var(--line)',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => setSelectedVoicingIndex(Math.max(0, voicingIndex - 1))}
              disabled={voicingIndex === 0}
              style={toolbarButtonStyle(false)}
            >
              ← 前
            </button>
            <button
              onClick={() => setSelectedVoicingIndex(Math.min(voicings.length - 1, voicingIndex + 1))}
              disabled={voicingIndex === voicings.length - 1}
              style={toolbarButtonStyle(false)}
            >
              次 →
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onPointerDown={handlePlayPointerDown}
              onPointerUp={handlePlayPointerUp}
              onPointerLeave={clearLongPressTimer}
              onPointerCancel={clearLongPressTimer}
              style={{ ...playButtonStyle, touchAction: 'none' }}
            >
              ストラム(長押しでアルペジオ)
            </button>
            <button
              onClick={() => toggleFavorite(selectedRoot, selectedType, voicingIndex)}
              aria-label="お気に入り切り替え"
              style={{
                ...toolbarButtonStyle(isFavoriteChord(favorites, selectedRoot, selectedType, voicingIndex)),
                minWidth: 44,
              }}
            >
              ★
            </button>
          </div>

          <button onClick={goToFretboard} style={{ ...toolbarButtonStyle(false), alignSelf: 'center' }}>
            指板で見る
          </button>
        </>
      ) : (
        <p style={{ color: 'var(--line)', textAlign: 'center' }}>このコードのボイシングが見つかりませんでした。</p>
      )}
    </div>
  );
}

function toolbarButtonStyle(active: boolean) {
  return {
    minHeight: 40,
    padding: '0 14px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--string)',
    fontSize: 13,
    flexShrink: 0,
  };
}

const playButtonStyle = {
  minHeight: 48,
  padding: '0 20px',
  borderRadius: 24,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--bg)',
  fontSize: 14,
  fontFamily: 'var(--font-display)',
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
