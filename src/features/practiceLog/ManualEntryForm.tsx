import { useState } from 'react';
import { PRESET_TAGS, todayDateString } from '../../data/practiceLogTypes';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';

interface ManualEntryFormProps {
  onAdd: (entry: { date: string; memo: string; minutes: number; tags: string[] }) => void;
  onCancel: () => void;
}

/** SPEC §5.7 手動記録: 日付・メモ・時間(分)・タグ(プリセット+自由追加). */
export function ManualEntryForm({ onAdd, onCancel }: ManualEntryFormProps) {
  const [date, setDate] = useState(todayDateString());
  const [memo, setMemo] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const toggleTag = (tag: string) => setTags((ts) => (ts.includes(tag) ? ts.filter((t) => t !== tag) : [...ts, tag]));

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !tags.includes(trimmed)) setTags((ts) => [...ts, trimmed]);
    setCustomTag('');
  };

  const customTags = tags.filter((t) => !PRESET_TAGS.includes(t));

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} aria-label="日付" />
      <input type="text" placeholder="練習内容メモ" value={memo} onChange={(e) => setMemo(e.target.value)} style={inputStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--line)' }}>時間(分)</span>
        <Button size="small" onClick={() => setMinutes((m) => Math.max(1, m - 5))}>
          −
        </Button>
        <span className="tabular-nums" style={{ minWidth: 32, textAlign: 'center' }}>
          {minutes}
        </span>
        <Button size="small" onClick={() => setMinutes((m) => Math.min(600, m + 5))}>
          +
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESET_TAGS.map((tag) => (
          <Chip key={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)}>
            {tag}
          </Chip>
        ))}
        {customTags.map((tag) => (
          <Chip key={tag} active onClick={() => toggleTag(tag)}>
            {tag} ×
          </Chip>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="タグを追加"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addCustomTag();
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <Button size="small" onClick={addCustomTag}>
          追加
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button size="small" onClick={onCancel}>
          キャンセル
        </Button>
        <button onClick={() => onAdd({ date, memo, minutes, tags })} disabled={minutes <= 0} className="btn btn-primary btn-small">
          保存
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  minHeight: 40,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--string)',
  fontSize: 14,
};
