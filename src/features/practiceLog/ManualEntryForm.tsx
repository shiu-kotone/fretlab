import { useState } from 'react';
import { PRESET_TAGS, todayDateString } from '../../data/practiceLogTypes';

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
        <button onClick={() => setMinutes((m) => Math.max(1, m - 5))} style={stepperButtonStyle}>
          −
        </button>
        <span className="tabular-nums" style={{ minWidth: 32, textAlign: 'center' }}>
          {minutes}
        </span>
        <button onClick={() => setMinutes((m) => Math.min(600, m + 5))} style={stepperButtonStyle}>
          +
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESET_TAGS.map((tag) => (
          <button key={tag} onClick={() => toggleTag(tag)} style={chipStyle(tags.includes(tag))}>
            {tag}
          </button>
        ))}
        {customTags.map((tag) => (
          <button key={tag} onClick={() => toggleTag(tag)} style={chipStyle(true)}>
            {tag} ×
          </button>
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
        <button onClick={addCustomTag} style={stepperButtonStyle}>
          追加
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={stepperButtonStyle}>
          キャンセル
        </button>
        <button onClick={() => onAdd({ date, memo, minutes, tags })} disabled={minutes <= 0} style={primaryButtonStyle}>
          保存
        </button>
      </div>
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
  };
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

const stepperButtonStyle = {
  minHeight: 36,
  minWidth: 36,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--string)',
  fontSize: 12,
};

const primaryButtonStyle = {
  minHeight: 40,
  padding: '0 16px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--bg)',
  fontSize: 13,
};
