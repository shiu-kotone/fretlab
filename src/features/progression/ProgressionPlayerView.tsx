import { useEffect, useState } from 'react';
import type { Progression } from '../../data/progressionTypes';
import { useProgressionEngine } from './useProgressionEngine';
import { useSettingsStore } from '../../stores/settingsStore';
import { ChordDiagram } from '../chords/ChordDiagram';
import { STRUM_PATTERNS, findStrumPattern } from '../../data/strumPatterns';
import { chordIdLabel } from './chordLabel';
import type { ChordTypeId } from '../../theory/chords';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Toggle } from '../../components/ui/Toggle';

interface ProgressionPlayerViewProps {
  progression: Progression;
  onEdit: () => void;
  onBack: () => void;
}

export function ProgressionPlayerView({ progression, onEdit, onBack }: ProgressionPlayerViewProps) {
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const clickVolume = useSettingsStore((s) => s.clickVolume);
  const setClickVolume = useSettingsStore((s) => s.setClickVolume);

  const [activeProgression, setActiveProgression] = useState(progression);
  useEffect(() => setActiveProgression(progression), [progression]);

  const engine = useProgressionEngine(activeProgression);

  const currentBarLabel = (barIndex: number) =>
    activeProgression.bars[barIndex]?.chords.map((c) => chordIdLabel(c.chordId, noteNaming)).join('/') ?? '';

  return (
    <div style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button size="small" onClick={onBack}>
          ← 一覧
        </Button>
        <span style={{ fontSize: 15, color: 'var(--string)' }}>{activeProgression.name}</span>
        <Button size="small" onClick={onEdit}>
          編集
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {activeProgression.bars.map((_, i) => (
          <div key={i} style={barChipStyle(engine.currentBarIndex === i)}>
            {currentBarLabel(i)}
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--line)', textAlign: 'center' }}>現在のコード</div>
        {engine.currentChord ? (
          <ChordDiagram
            voicing={engine.currentChord.voicing}
            root={engine.currentChord.root}
            typeId={engine.currentChord.typeId as ChordTypeId}
            noteNaming={noteNaming}
            leftHanded={leftHanded}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--line)', padding: 24 }}>-</div>
        )}
      </div>
      <div style={{ opacity: 0.7, maxWidth: '55%', margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: 'var(--line)', textAlign: 'center' }}>次のコード</div>
        {engine.nextChord ? (
          <ChordDiagram
            voicing={engine.nextChord.voicing}
            root={engine.nextChord.root}
            typeId={engine.nextChord.typeId as ChordTypeId}
            noteNaming={noteNaming}
            leftHanded={leftHanded}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--line)', padding: 24 }}>-</div>
        )}
      </div>

      <button onClick={engine.toggle} className="btn btn-primary" style={playButtonStyle}>
        {engine.isPlaying ? '停止' : '再生(カウントイン1小節)'}
      </button>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--line)' }}>BPM</span>
        <Button size="small" onClick={() => engine.setBpm(engine.bpm - 1)}>
          −
        </Button>
        <span className="tabular-nums" style={{ fontSize: 18, color: 'var(--accent)', minWidth: 36, textAlign: 'center' }}>
          {engine.bpm}
        </span>
        <Button size="small" onClick={() => engine.setBpm(engine.bpm + 1)}>
          +
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--string)', minHeight: 44 }}>
          <Toggle checked={engine.clickEnabled} onChange={(e) => engine.setClickEnabled(e.target.checked)} aria-label="クリック併走" />
          クリック併走
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={clickVolume}
          onChange={(e) => setClickVolume(Number(e.target.value))}
          className="slider"
          style={{ flex: 1 }}
          aria-label="クリック音量"
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--line)', marginBottom: 4 }}>
          ストラムパターン{engine.isPlaying ? '(次回再生から反映)' : ''} — {findStrumPattern(activeProgression.strumPatternId).label}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {STRUM_PATTERNS.map((sp) => (
            <Chip key={sp.id} active={activeProgression.strumPatternId === sp.id} onClick={() => setActiveProgression((p) => ({ ...p, strumPatternId: sp.id }))}>
              {sp.label}
            </Chip>
          ))}
        </div>
      </div>

      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--string)', minHeight: 44 }}>
        <Toggle
          checked={activeProgression.loop}
          disabled={engine.isPlaying}
          onChange={(e) => setActiveProgression((p) => ({ ...p, loop: e.target.checked }))}
          aria-label="ループ再生"
        />
        ループ再生
      </label>
    </div>
  );
}

const playButtonStyle = {
  minHeight: 52,
  borderRadius: 26,
  fontSize: 16,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
};

const barChipStyle = (active: boolean) => ({
  minHeight: 32,
  padding: '0 8px',
  borderRadius: 6,
  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
  background: active ? 'var(--accent)' : 'var(--surface)',
  color: active ? 'var(--bg)' : 'var(--string)',
  fontSize: 11,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
});
