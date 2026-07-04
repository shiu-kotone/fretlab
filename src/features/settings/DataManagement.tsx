import { useRef, useState } from 'react';
import { buildExportPayload, applyImportPayload, isExportPayload } from './dataTransfer';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { useProgressionStore } from '../../stores/progressionStore';
import { usePracticeLogStore } from '../../stores/practiceLogStore';
import { useRecordingsStore } from '../../stores/recordingsStore';

/** SPEC §4.7/§5.8 データ: エクスポート/インポート、練習記録・録音の全消去(二重確認). */
export function DataManagement() {
  const loadCustomTunings = useCustomTuningsStore((s) => s.load);
  const loadProgressions = useProgressionStore((s) => s.load);
  const loadPracticeLog = usePracticeLogStore((s) => s.load);
  const clearPracticeLog = usePracticeLogStore((s) => s.clearAll);
  const clearRecordings = useRecordingsStore((s) => s.clearAll);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = async () => {
    const payload = await buildExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `fretlab-export-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('エクスポートしました。');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);
      if (!isExportPayload(data)) {
        setMessage('インポートに失敗しました: ファイル形式が不正です。');
        return;
      }
      if (!window.confirm('現在のカスタムチューニング・自作進行・お気に入り・練習記録を、このファイルの内容で置き換えます。よろしいですか？')) {
        return;
      }
      await applyImportPayload(data);
      await Promise.all([loadCustomTunings(), loadProgressions(), loadPracticeLog()]);
      setMessage('インポートしました。');
    } catch {
      setMessage('インポートに失敗しました: ファイルを読み込めませんでした。');
    }
  };

  const handleClearPracticeLog = () => {
    if (!window.confirm('練習記録をすべて削除します。よろしいですか？')) return;
    if (!window.confirm('本当に削除してよろしいですか？この操作は取り消せません。')) return;
    void clearPracticeLog().then(() => setMessage('練習記録を削除しました。'));
  };

  const handleClearRecordings = () => {
    if (!window.confirm('録音をすべて削除します。よろしいですか？')) return;
    if (!window.confirm('本当に削除してよろしいですか？この操作は取り消せません。')) return;
    void clearRecordings().then(() => setMessage('録音を削除しました。'));
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={headingStyle}>データ</h3>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => void handleExport()} style={buttonStyle}>
          エクスポート
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={buttonStyle}>
          インポート
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleClearPracticeLog} style={{ ...buttonStyle, color: 'var(--warn)' }}>
          練習記録を全消去
        </button>
        <button onClick={handleClearRecordings} style={{ ...buttonStyle, color: 'var(--warn)' }}>
          録音を全消去
        </button>
      </div>

      {message && <p style={{ fontSize: 12, color: 'var(--accent)', margin: 0 }}>{message}</p>}
    </section>
  );
}

const headingStyle = { fontSize: 13, color: 'var(--string)', margin: 0 };

const buttonStyle = {
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
  fontSize: 13,
};
