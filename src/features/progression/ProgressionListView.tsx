import type { Progression } from '../../data/progressionTypes';
import { isPresetProgressionId } from '../../data/presetProgressions';

interface ProgressionListViewProps {
  presets: Progression[];
  userProgressions: Progression[];
  onOpenPlayer: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (p: Progression) => void;
  onDelete: (id: string) => void;
}

export function ProgressionListView({
  presets,
  userProgressions,
  onOpenPlayer,
  onOpenEditor,
  onCreate,
  onDuplicate,
  onDelete,
}: ProgressionListViewProps) {
  return (
    <div style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onCreate} style={primaryButtonStyle}>
        + 新しい進行を作成
      </button>

      <section>
        <h3 style={sectionTitleStyle}>プリセット</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {presets.map((p) => (
            <ProgressionRow
              key={p.id}
              progression={p}
              onPlay={() => onOpenPlayer(p.id)}
              onEdit={() => onDuplicate(p)}
              editLabel="複製して編集"
            />
          ))}
        </div>
      </section>

      <section>
        <h3 style={sectionTitleStyle}>マイ進行</h3>
        {userProgressions.length === 0 && <p style={{ color: 'var(--line)', fontSize: 13 }}>まだありません。上のボタンから作成できます。</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {userProgressions.map((p) => (
            <ProgressionRow
              key={p.id}
              progression={p}
              onPlay={() => onOpenPlayer(p.id)}
              onEdit={() => onOpenEditor(p.id)}
              editLabel="編集"
              onDuplicate={() => onDuplicate(p)}
              onDelete={() => onDelete(p.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressionRow({
  progression,
  onPlay,
  onEdit,
  editLabel,
  onDuplicate,
  onDelete,
}: {
  progression: Progression;
  onPlay: () => void;
  onEdit: () => void;
  editLabel: string;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const isPreset = isPresetProgressionId(progression.id);
  return (
    <div style={rowStyle}>
      <button onClick={onPlay} style={{ ...rowButtonStyle, flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: 15, color: 'var(--string)' }}>{progression.name}</div>
        <div style={{ fontSize: 11, color: 'var(--line)' }}>
          {progression.bars.length}小節 / {progression.bpm}BPM / {progression.timeSig.beats}/{progression.timeSig.unit}
        </div>
      </button>
      <button onClick={onEdit} style={smallButtonStyle}>
        {editLabel}
      </button>
      {!isPreset && onDuplicate && (
        <button onClick={onDuplicate} style={smallButtonStyle}>
          複製
        </button>
      )}
      {!isPreset && onDelete && (
        <button
          onClick={() => {
            if (window.confirm(`「${progression.name}」を削除しますか？`)) onDelete();
          }}
          style={{ ...smallButtonStyle, color: 'var(--warn)' }}
        >
          削除
        </button>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  minHeight: 48,
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--bg)',
  fontSize: 15,
  fontFamily: 'var(--font-display)',
};

const sectionTitleStyle = { fontSize: 13, color: 'var(--line)', margin: '0 0 8px' };

const rowStyle = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 6,
  background: 'var(--surface)',
  borderRadius: 8,
  border: '1px solid var(--line)',
  padding: 4,
};

const rowButtonStyle = {
  minHeight: 44,
  border: 'none',
  background: 'transparent',
  color: 'var(--string)',
  padding: '4px 8px',
};

const smallButtonStyle = {
  minHeight: 44,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--string)',
  fontSize: 12,
  flexShrink: 0,
};
