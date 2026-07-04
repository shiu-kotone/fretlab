import { useEffect, useState } from 'react';
import type { Progression, Bar, ProgressionTimeSig } from '../../data/progressionTypes';
import { createEmptyBar, validateProgression } from '../../data/progressionTypes';
import { chordIdFor, parseChordId, getVoicingsForChord, pickTransposedVoicing } from '../../data/chordLibrary';
import { CHORD_TYPES, type ChordGroup, type ChordTypeId } from '../../theory/chords';
import { STRUM_PATTERNS } from '../../data/strumPatterns';
import { useSettingsStore } from '../../stores/settingsStore';
import { noteName } from '../../theory/pitch';
import { chordIdLabel } from './chordLabel';

const GROUP_LABELS: Record<ChordGroup, string> = { basic: '基本', seventh: 'セブンス', tension: 'テンション', other: 'その他' };
const GROUPS: ChordGroup[] = ['basic', 'seventh', 'tension', 'other'];
const TIME_SIG_PRESETS: ProgressionTimeSig[] = [
  { beats: 4, unit: 4 },
  { beats: 3, unit: 4 },
  { beats: 6, unit: 8 },
  { beats: 12, unit: 8 },
];

interface ProgressionEditorProps {
  progression: Progression;
  readOnly: boolean;
  onSave: (p: Progression) => void;
  onDuplicateAndEdit: () => void;
  onPlay: (p: Progression) => void;
  onBack: () => void;
}

export function ProgressionEditor({ progression, readOnly, onSave, onDuplicateAndEdit, onPlay, onBack }: ProgressionEditorProps) {
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const [draft, setDraft] = useState<Progression>(progression);
  const [editingBarIndex, setEditingBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraft(progression);
    setEditingBarIndex(null);
  }, [progression]);

  const errors = validateProgression(draft);

  const updateBars = (bars: Bar[]) => setDraft((d) => ({ ...d, bars }));

  const addBar = () => {
    const lastChord = draft.bars[draft.bars.length - 1]?.chords[0];
    updateBars([...draft.bars, createEmptyBar(draft.timeSig.beats, lastChord?.chordId ?? '0-maj', lastChord?.voicingIndex ?? 0)]);
  };

  const removeBar = (i: number) => {
    if (draft.bars.length <= 1) return;
    updateBars(draft.bars.filter((_, idx) => idx !== i));
    setEditingBarIndex(null);
  };

  const duplicateBar = (i: number) => {
    const copy = draft.bars.length < 64 ? [...draft.bars] : draft.bars;
    if (draft.bars.length >= 64) return;
    copy.splice(i + 1, 0, JSON.parse(JSON.stringify(draft.bars[i])));
    updateBars(copy);
  };

  const moveBar = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= draft.bars.length) return;
    const bars = [...draft.bars];
    [bars[i], bars[target]] = [bars[target], bars[i]];
    updateBars(bars);
    setEditingBarIndex(target);
  };

  const splitBar = (i: number) => {
    const bar = draft.bars[i];
    if (bar.chords.length !== 1) return;
    const total = bar.chords[0].beats;
    const first = Math.ceil(total / 2);
    const second = total - first;
    if (second < 1) return;
    const bars = [...draft.bars];
    bars[i] = {
      chords: [
        { ...bar.chords[0], beats: first },
        { ...bar.chords[0], beats: second },
      ],
    };
    updateBars(bars);
  };

  const mergeBar = (i: number) => {
    const bar = draft.bars[i];
    if (bar.chords.length !== 2) return;
    const bars = [...draft.bars];
    bars[i] = { chords: [{ ...bar.chords[0], beats: draft.timeSig.beats }] };
    updateBars(bars);
  };

  const updateSlot = (barIndex: number, slotIndex: number, root: number, typeId: ChordTypeId) => {
    const bars = draft.bars.map((bar, bi) => {
      if (bi !== barIndex) return bar;
      const chords = bar.chords.map((c, ci) => (ci === slotIndex ? { ...c, chordId: chordIdFor(root, typeId), voicingIndex: 0 } : c));
      return { chords };
    });
    updateBars(bars);
  };

  const updateSlotVoicing = (barIndex: number, slotIndex: number, delta: number) => {
    const bars = draft.bars.map((bar, bi) => {
      if (bi !== barIndex) return bar;
      const chords = bar.chords.map((c, ci) => {
        if (ci !== slotIndex) return c;
        const parsed = parseChordId(c.chordId);
        if (!parsed) return c;
        const count = getVoicingsForChord(parsed.root, parsed.typeId).length;
        const next = Math.max(0, Math.min(count - 1, c.voicingIndex + delta));
        return { ...c, voicingIndex: next };
      });
      return { chords };
    });
    updateBars(bars);
  };

  const updateSlotBeats = (barIndex: number, firstBeats: number) => {
    const bar = draft.bars[barIndex];
    if (bar.chords.length !== 2) return;
    const total = draft.timeSig.beats;
    const clamped = Math.max(1, Math.min(total - 1, firstBeats));
    const bars = draft.bars.map((b, bi) =>
      bi !== barIndex ? b : { chords: [{ ...b.chords[0], beats: clamped }, { ...b.chords[1], beats: total - clamped }] },
    );
    updateBars(bars);
  };

  const changeTimeSig = (sig: ProgressionTimeSig) => {
    // Simplification: switching meter re-flattens every bar to a single chord spanning the new bar length, keeping each bar's first chord.
    const bars = draft.bars.map((bar) => ({ chords: [{ ...bar.chords[0], beats: sig.beats }] }));
    setDraft((d) => ({ ...d, timeSig: sig, bars }));
  };

  const transpose = (semitones: number) => {
    const bars = draft.bars.map((bar) => ({
      chords: bar.chords.map((slot) => {
        const parsed = parseChordId(slot.chordId);
        if (!parsed) return slot;
        const result = pickTransposedVoicing(parsed.root, parsed.typeId, slot.voicingIndex, semitones);
        return { ...slot, chordId: chordIdFor(result.root, parsed.typeId), voicingIndex: result.voicingIndex };
      }),
    }));
    updateBars(bars);
  };

  const handleSave = () => {
    if (errors.length > 0) return;
    onSave(draft);
  };

  return (
    <div style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={smallButtonStyle}>
          ← 一覧
        </button>
        {readOnly && (
          <button onClick={onDuplicateAndEdit} style={{ ...smallButtonStyle, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            複製して編集
          </button>
        )}
      </div>

      <input
        type="text"
        value={draft.name}
        disabled={readOnly}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        style={nameInputStyle}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Stepper label="BPM" value={draft.bpm} min={40} max={240} disabled={readOnly} onChange={(v) => setDraft((d) => ({ ...d, bpm: v }))} />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--string)' }}>
          <input type="checkbox" checked={draft.loop} disabled={readOnly} onChange={(e) => setDraft((d) => ({ ...d, loop: e.target.checked }))} />
          ループ再生
        </label>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {TIME_SIG_PRESETS.map((sig) => (
          <button
            key={`${sig.beats}/${sig.unit}`}
            disabled={readOnly}
            onClick={() => changeTimeSig(sig)}
            style={chipStyle(draft.timeSig.beats === sig.beats && draft.timeSig.unit === sig.unit)}
          >
            {sig.beats}/{sig.unit}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {STRUM_PATTERNS.map((p) => (
          <button
            key={p.id}
            disabled={readOnly}
            onClick={() => setDraft((d) => ({ ...d, strumPatternId: p.id }))}
            style={chipStyle(draft.strumPatternId === p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!readOnly && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--line)' }}>移調</span>
          <button onClick={() => transpose(-1)} style={smallButtonStyle}>
            -1
          </button>
          <button onClick={() => transpose(1)} style={smallButtonStyle}>
            +1
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {draft.bars.map((bar, i) => (
          <button key={i} onClick={() => setEditingBarIndex(editingBarIndex === i ? null : i)} style={barBoxStyle(editingBarIndex === i)}>
            <div style={{ fontSize: 10, color: 'var(--line)' }}>{i + 1}</div>
            <div style={{ fontSize: 13 }}>{bar.chords.map((c) => chordIdLabel(c.chordId, noteNaming)).join(' / ')}</div>
          </button>
        ))}
      </div>

      {!readOnly && (
        <button onClick={addBar} disabled={draft.bars.length >= 64} style={smallButtonStyle}>
          + 小節を追加
        </button>
      )}

      {editingBarIndex !== null && draft.bars[editingBarIndex] && (
        <BarEditorPanel
          bar={draft.bars[editingBarIndex]}
          barIndex={editingBarIndex}
          timeSig={draft.timeSig}
          readOnly={readOnly}
          noteNaming={noteNaming}
          onUpdateSlot={updateSlot}
          onUpdateSlotVoicing={updateSlotVoicing}
          onUpdateSlotBeats={updateSlotBeats}
          onSplit={() => splitBar(editingBarIndex)}
          onMerge={() => mergeBar(editingBarIndex)}
          onDuplicate={() => duplicateBar(editingBarIndex)}
          onDelete={() => removeBar(editingBarIndex)}
          onMoveUp={() => moveBar(editingBarIndex, -1)}
          onMoveDown={() => moveBar(editingBarIndex, 1)}
          canDelete={draft.bars.length > 1}
        />
      )}

      {errors.length > 0 && (
        <div style={{ color: 'var(--warn)', fontSize: 12 }}>
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {!readOnly && (
        <button onClick={handleSave} disabled={errors.length > 0} style={primaryButtonStyle}>
          保存
        </button>
      )}
      <button onClick={() => onPlay(draft)} disabled={errors.length > 0} style={smallButtonStyle}>
        再生する
      </button>
    </div>
  );
}

interface BarEditorPanelProps {
  bar: Bar;
  barIndex: number;
  timeSig: ProgressionTimeSig;
  readOnly: boolean;
  noteNaming: { flat: boolean; solfege: boolean };
  onUpdateSlot: (barIndex: number, slotIndex: number, root: number, typeId: ChordTypeId) => void;
  onUpdateSlotVoicing: (barIndex: number, slotIndex: number, delta: number) => void;
  onUpdateSlotBeats: (barIndex: number, firstBeats: number) => void;
  onSplit: () => void;
  onMerge: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canDelete: boolean;
}

function BarEditorPanel({
  bar,
  barIndex,
  timeSig,
  readOnly,
  noteNaming,
  onUpdateSlot,
  onUpdateSlotVoicing,
  onUpdateSlotBeats,
  onSplit,
  onMerge,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canDelete,
}: BarEditorPanelProps) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={onMoveUp} style={smallButtonStyle}>
          ▲
        </button>
        <button onClick={onMoveDown} style={smallButtonStyle}>
          ▼
        </button>
        {!readOnly && (
          <>
            <button onClick={onDuplicate} style={smallButtonStyle}>
              複製
            </button>
            <button onClick={onDelete} disabled={!canDelete} style={{ ...smallButtonStyle, color: 'var(--warn)' }}>
              削除
            </button>
            {bar.chords.length === 1 ? (
              <button onClick={onSplit} style={smallButtonStyle}>
                分割
              </button>
            ) : (
              <button onClick={onMerge} style={smallButtonStyle}>
                結合
              </button>
            )}
          </>
        )}
      </div>

      {bar.chords.map((slot, slotIndex) => {
        const parsed = parseChordId(slot.chordId);
        const voicingCount = parsed ? getVoicingsForChord(parsed.root, parsed.typeId).length : 1;
        return (
          <div key={slotIndex} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: slotIndex > 0 ? '1px solid var(--line)' : undefined, paddingTop: slotIndex > 0 ? 8 : 0 }}>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              {Array.from({ length: 12 }, (_, pc) => pc).map((pc) => (
                <button
                  key={pc}
                  disabled={readOnly}
                  onClick={() => onUpdateSlot(barIndex, slotIndex, pc, parsed?.typeId ?? 'maj')}
                  style={chipStyle(parsed?.root === pc)}
                >
                  {noteName(60 + pc, noteNaming).replace(/\d+$/, '')}
                </button>
              ))}
            </div>
            {GROUPS.map((group) => (
              <div key={group} style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--line)', flexShrink: 0, minWidth: 40 }}>{GROUP_LABELS[group]}</span>
                {CHORD_TYPES.filter((t) => t.group === group).map((t) => (
                  <button
                    key={t.id}
                    disabled={readOnly}
                    onClick={() => onUpdateSlot(barIndex, slotIndex, parsed?.root ?? 0, t.id)}
                    style={chipStyle(parsed?.typeId === t.id)}
                  >
                    {t.symbol || 'maj'}
                  </button>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--line)' }}>ボイシング {slot.voicingIndex + 1}/{voicingCount}</span>
              <button disabled={readOnly} onClick={() => onUpdateSlotVoicing(barIndex, slotIndex, -1)} style={smallButtonStyle}>
                ←
              </button>
              <button disabled={readOnly} onClick={() => onUpdateSlotVoicing(barIndex, slotIndex, 1)} style={smallButtonStyle}>
                →
              </button>
            </div>
            {bar.chords.length === 2 && slotIndex === 0 && (
              <Stepper
                label="拍数"
                value={slot.beats}
                min={1}
                max={timeSig.beats - 1}
                disabled={readOnly}
                onChange={(v) => onUpdateSlotBeats(barIndex, v)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stepper({ label, value, min, max, disabled, onChange }: { label: string; value: number; min: number; max: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--line)' }}>{label}</span>
      <button disabled={disabled} onClick={() => onChange(Math.max(min, value - 1))} style={smallButtonStyle}>
        −
      </button>
      <span className="tabular-nums" style={{ fontSize: 14, color: 'var(--string)', minWidth: 28, textAlign: 'center' }}>
        {value}
      </span>
      <button disabled={disabled} onClick={() => onChange(Math.min(max, value + 1))} style={smallButtonStyle}>
        +
      </button>
    </div>
  );
}

function chipStyle(active: boolean) {
  return {
    minHeight: 36,
    padding: '0 10px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--bg)',
    color: active ? 'var(--bg)' : 'var(--string)',
    fontSize: 12,
    flexShrink: 0,
  };
}

function barBoxStyle(active: boolean) {
  return {
    minHeight: 48,
    borderRadius: 6,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--surface)' : 'var(--bg)',
    color: 'var(--string)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  };
}

const smallButtonStyle = {
  minHeight: 40,
  padding: '0 12px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
  fontSize: 12,
};

const primaryButtonStyle = {
  minHeight: 48,
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--bg)',
  fontSize: 15,
  fontFamily: 'var(--font-display)',
};

const nameInputStyle = {
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
  fontSize: 15,
};
