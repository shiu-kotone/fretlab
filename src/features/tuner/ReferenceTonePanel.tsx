import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { resolveTuning } from '../../theory/tuningResolver';
import { noteName } from '../../theory/pitch';
import { getGuitarSynth, unlockAudio } from '../../audio/AudioEngine';

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

  const stopRepeat = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveString(null);
  };

  useEffect(() => stopRepeat, []);

  const playString = async (index: number) => {
    await unlockAudio();
    stopRepeat();
    const midi = tuning[index];
    const play = () => getGuitarSynth().pluck(midi, { a4, sustainSeconds: REFERENCE_TONE_SECONDS, velocity: 0.8, brightness: 0.5 });
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
            if (!e.target.checked) stopRepeat();
          }}
        />
      </label>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {tuning.map((midi, i) => {
          const isActive = activeString === i;
          return (
            <button
              key={i}
              onClick={() => void playString(i)}
              style={{
                minWidth: 52,
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
          onClick={stopRepeat}
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
