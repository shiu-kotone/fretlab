import type { RecordingMeta } from '../../stores/recordingsStore';
import { formatDuration, formatFileSize } from '../../audio/recorder';
import { RecordingPlayer } from './RecordingPlayer';

interface RecordingListProps {
  items: RecordingMeta[];
  expandedId: number | null;
  onToggle: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  getBlob: (id: number) => Promise<Blob | null>;
}

/** SPEC §5.6: date-descending list (rows: name/date/length/size); tap to expand into the inline player. */
export function RecordingList({ items, expandedId, onToggle, onRename, onDelete, getBlob }: RecordingListProps) {
  if (items.length === 0) {
    return <p style={{ color: 'var(--line)', fontSize: 13 }}>まだ録音がありません。上の「録音開始」から始められます。</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((r) => (
        <div key={r.id}>
          <button onClick={() => onToggle(r.id)} className="tap-row" style={rowStyle(expandedId === r.id)}>
            <div style={{ fontSize: 14, color: 'var(--string)' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--line)' }}>
              {new Date(r.createdAt).toLocaleString('ja-JP')} ・ {formatDuration(r.durationSeconds)} ・ {formatFileSize(r.sizeBytes)}
            </div>
          </button>
          {expandedId === r.id && (
            <div style={{ marginTop: 6 }}>
              <RecordingPlayer recording={r} onRename={(name) => onRename(r.id, name)} onDelete={() => onDelete(r.id)} getBlob={() => getBlob(r.id)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function rowStyle(active: boolean) {
  return {
    width: '100%',
    textAlign: 'left' as const,
    minHeight: 52,
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: 'var(--surface)',
    padding: '8px 12px',
  };
}
