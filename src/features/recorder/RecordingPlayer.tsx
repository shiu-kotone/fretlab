import { useEffect, useRef, useState } from 'react';
import type { RecordingMeta } from '../../stores/recordingsStore';
import { formatDuration } from '../../audio/recorder';

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
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--line)' }}>
        <span className="tabular-nums">{formatDuration(position)}</span>
        <span className="tabular-nums">{formatDuration(duration || recording.durationSeconds)}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={togglePlay} style={smallButtonStyle}>
          {playing ? '一時停止' : '再生'}
        </button>
        <button onClick={() => setLoopA(position)} style={chipStyle(loopA !== null)}>
          A{loopA !== null ? `:${formatDuration(loopA)}` : ''}
        </button>
        <button onClick={() => setLoopB(position)} style={chipStyle(loopB !== null)}>
          B{loopB !== null ? `:${formatDuration(loopB)}` : ''}
        </button>
        <button onClick={() => { setLoopA(null); setLoopB(null); }} disabled={loopA === null && loopB === null} style={smallButtonStyle}>
          ループ解除
        </button>
        <button onClick={() => setRate(rate === 1 ? 0.75 : 1)} style={smallButtonStyle}>
          {rate}x
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={handleShare} style={smallButtonStyle}>
          共有
        </button>
        <button
          onClick={() => {
            if (window.confirm(`「${recording.name}」を削除しますか？`)) onDelete();
          }}
          style={{ ...smallButtonStyle, color: 'var(--warn)' }}
        >
          削除
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

const smallButtonStyle = {
  minHeight: 36,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--string)',
  fontSize: 12,
};

const nameInputStyle = {
  minHeight: 40,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--string)',
  fontSize: 14,
};
