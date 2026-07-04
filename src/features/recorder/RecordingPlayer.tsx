import { useEffect, useRef, useState } from 'react';
import type { RecordingMeta } from '../../stores/recordingsStore';
import { formatDuration } from '../../audio/recorder';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface RecordingPlayerProps {
  recording: RecordingMeta;
  onRename: (name: string) => void;
  onDelete: () => void;
  getBlob: () => Promise<Blob | null>;
}

/** SPEC §5.6: seek bar, A-B loop, 0.75/1.0x speed, rename, delete, share. */
export function RecordingPlayer({ recording, onRename, onDelete, getBlob }: RecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [name, setName] = useState(recording.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    void getBlob().then((blob) => {
      if (!blob || cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [getBlob]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, url]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setPosition(audio.currentTime);
    if (loopA !== null && loopB !== null && audio.currentTime >= loopB) {
      audio.currentTime = loopA;
    }
  };

  const seek = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setPosition(t);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== recording.name) onRename(trimmed);
    else setName(recording.name);
  };

  const handleShare = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const ext = recording.mimeType.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([blob], `${recording.name}.${ext}`, { type: recording.mimeType });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean; share?: (data: { files: File[]; title?: string }) => Promise<void> };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: recording.name });
      } catch {
        // user cancelled the share sheet — not an error
      }
    } else if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    }
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <audio
        ref={audioRef}
        src={url ?? undefined}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || recording.durationSeconds)}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <input value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName} style={nameInputStyle} />

      <input
        type="range"
        min={0}
        max={duration || recording.durationSeconds || 0}
        step={0.1}
        value={position}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="再生位置"
        className="slider"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--line)' }}>
        <span className="tabular-nums">{formatDuration(position)}</span>
        <span className="tabular-nums">{formatDuration(duration || recording.durationSeconds)}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Button size="small" onClick={togglePlay}>
          {playing ? '一時停止' : '再生'}
        </Button>
        <Chip active={loopA !== null} onClick={() => setLoopA(position)}>
          A{loopA !== null ? `:${formatDuration(loopA)}` : ''}
        </Chip>
        <Chip active={loopB !== null} onClick={() => setLoopB(position)}>
          B{loopB !== null ? `:${formatDuration(loopB)}` : ''}
        </Chip>
        <Button
          size="small"
          onClick={() => {
            setLoopA(null);
            setLoopB(null);
          }}
          disabled={loopA === null && loopB === null}
        >
          ループ解除
        </Button>
        <Button size="small" onClick={() => setRate(rate === 1 ? 0.75 : 1)}>
          {rate}x
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Button size="small" onClick={() => void handleShare()}>
          共有
        </Button>
        <Button size="small" variant="danger" onClick={() => setConfirmingDelete(true)}>
          削除
        </Button>
        <ConfirmDialog
          open={confirmingDelete}
          title="録音を削除"
          message={`「${recording.name}」を削除しますか？`}
          confirmLabel="削除"
          danger
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      </div>
    </div>
  );
}

const nameInputStyle = {
  minHeight: 40,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--string)',
  fontSize: 14,
};
