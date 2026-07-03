import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { resolveTuning } from '../../theory/tuningResolver';
import { noteName } from '../../theory/pitch';
import { getGuitarSynth, unlockAudio } from '../../audio/AudioEngine';
import type { PluckHandle } from '../../audio/karplusStrong';

const REFERENCE_TONE_SECONDS = 3;

/** SPEC §5.5 mode 2: fallback for no-mic-permission environments / ear tuning. */
export function ReferenceTonePanel() {
  const a4 = useSettingsStore((s) => s.a4);
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const customItems = useCustomTuningsStore((s) => s.items);
  const tuning = resolveTuning(currentTuningId, customItems);

  const [repeat, setRepeat] = useState(false);
  const [activeString, setActiveString] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  // Only one reference tone should ever ring at a time: overlapping Karplus-Strong
  // voices sum on the shared guitar bus and can clip into harsh distortion, and
  // "stop" should silence the currently-ringing voice immediately, not just cancel
  // future repeats.
  const activeVoiceRef = useRef<PluckHandle | null>(null);

  const stop = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    activeVoiceRef.current?.stop();
    activeVoiceRef.current = null;
    setActiveString(null);
  };

  useEffect(() => stop, []);

  const playString = async (index: number) => {
    await unlockAudio();
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const midi = tuning[index];
    const play = () => {
      activeVoiceRef.current?.stop();
      activeVoiceRef.current = getGuitarSynth().pluck(midi, {
        a4,
        sustainSeconds: REFERENCE_TONE_SECONDS,
        velocity: 0.8,
        brightness: 0.5,
      });
    };
    play();
    setActiveString(index);
    if (repeat) {
      intervalRef.current = window.setInterval(play, REFERENCE_TONE_SECONDS * 1000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>リピート再生</span>
        <input
          type="checkbox"
          checked={repeat}
          onChange={(e) => {
            setRepeat(e.target.checked);
            if (!e.target.checked && intervalRef.current !== null) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 280, margin: '0 auto' }}>
        {tuning.map((midi, i) => {
          const isActive = activeString === i;
          return (
            <button
              key={i}
              onClick={() => void playString(i)}
              style={{
                minHeight: 56,
                borderRadius: 8,
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                background: isActive ? 'var(--accent)' : 'var(--surface)',
                color: isActive ? 'var(--bg)' : 'var(--accent)',
              }}
            >
              {6 - i}弦
              <br />
              <span style={{ fontSize: 12, color: isActive ? 'var(--bg)' : 'var(--string)' }}>
                {noteName(midi, noteNaming)}
              </span>
            </button>
          );
        })}
      </div>

      {activeString !== null && (
        <button
          onClick={stop}
          style={{
            alignSelf: 'center',
            minHeight: 40,
            padding: '0 16px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--string)',
          }}
        >
          停止
        </button>
      )}
    </div>
  );
}
