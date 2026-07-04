import { useEffect, useState } from 'react';
import { useRecorderEngine } from './useRecorderEngine';
import { useRecordingsStore } from '../../stores/recordingsStore';
import { useMetronomeControlStore } from '../../stores/metronomeControlStore';
import { useMetronomeStore } from '../../stores/metronomeStore';
import { formatDuration, formatFileSize } from '../../audio/recorder';
import { LevelMeter } from './LevelMeter';
import { RecordingList } from './RecordingList';
import { Button } from '../../components/ui/Button';

interface StorageInfo {
  usage: number;
  quota: number;
}

/** SPEC §5.6 タブ: ラボ > 「録音」. */
export function RecorderView() {
  const engine = useRecorderEngine();
  const items = useRecordingsStore((s) => s.items);
  const loaded = useRecordingsStore((s) => s.loaded);
  const load = useRecordingsStore((s) => s.load);
  const rename = useRecordingsStore((s) => s.rename);
  const remove = useRecordingsStore((s) => s.remove);
  const getBlob = useRecordingsStore((s) => s.getBlob);

  const metronomeToggle = useMetronomeControlStore((s) => s.toggle);
  const metronomeIsPlaying = useMetronomeStore((s) => s.isPlaying);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  useEffect(() => {
    // SPEC §5.6: request persistent storage once to reduce iOS's automatic eviction risk; harmless to call repeatedly.
    navigator.storage?.persist?.().catch(() => {});
    navigator.storage
      ?.estimate?.()
      .then((e) => setStorageInfo({ usage: e.usage ?? 0, quota: e.quota ?? 0 }))
      .catch(() => {});
  }, [items.length]);

  return (
    <div style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {engine.permissionState === 'denied' && (
        <p style={{ color: 'var(--warn)', fontSize: 13, margin: 0 }}>
          マイクへのアクセスが許可されていません。iPhoneの「設定」→「Safari」→「マイク」で許可してください。
        </p>
      )}
      {engine.permissionState === 'error' && engine.lastError && (
        <p style={{ color: 'var(--warn)', fontSize: 13, margin: 0 }}>{engine.lastError}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {engine.isRecording && (
          <>
            <div className="tabular-nums" style={{ fontSize: 40, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
              {formatDuration(engine.elapsedSeconds)}
            </div>
            <LevelMeter level={engine.level} />
          </>
        )}
        <button
          onClick={() => (engine.isRecording ? engine.stop() : void engine.start())}
          className={`btn ${engine.isRecording ? '' : 'btn-primary'}`}
          style={{ ...recordButtonStyle, ...(engine.isRecording ? { background: 'var(--warn)', borderColor: 'var(--warn)', color: 'var(--bg)' } : {}) }}
        >
          {engine.isRecording ? '■ 停止' : '● 録音開始'}
        </button>

        {metronomeToggle && (
          <Button size="small" onClick={metronomeToggle}>
            {metronomeIsPlaying ? 'メトロノームを停止' : 'メトロノームを併走(クリック音がマイクに混入します)'}
          </Button>
        )}
      </div>

      {storageInfo && (
        <p style={{ fontSize: 11, color: 'var(--line)', textAlign: 'center', margin: 0 }}>
          ストレージ使用量: {formatFileSize(storageInfo.usage)} / {formatFileSize(storageInfo.quota)}
        </p>
      )}

      <RecordingList
        items={items}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
        onRename={rename}
        onDelete={(id) => {
          if (expandedId === id) setExpandedId(null);
          void remove(id);
        }}
        getBlob={getBlob}
      />
    </div>
  );
}

const recordButtonStyle = {
  minWidth: 160,
  minHeight: 52,
  borderRadius: 26,
  fontSize: 16,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
};
