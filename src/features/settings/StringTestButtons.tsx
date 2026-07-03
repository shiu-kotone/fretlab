import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { resolveTuning } from '../../theory/tuningResolver';
import { noteName } from '../../theory/pitch';
import { getGuitarSynth, unlockAudio } from '../../audio/AudioEngine';
import type { PluckHandle } from '../../audio/karplusStrong';

/**
 * SPEC §8 Phase 0 acceptance: "テストボタンで弦の音が鳴り" — a minimal demo of the
 * Karplus-Strong guitar synth via the current tuning. This UI is superseded by the
 * fretboard (Phase 3) and tuner reference-tone mode (§5.5), but stays useful as a
 * quick audio-path smoke test.
 */
export function StringTestButtons() {
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const a4 = useSettingsStore((s) => s.a4);
  const customItems = useCustomTuningsStore((s) => s.items);
  const tuning = resolveTuning(currentTuningId, customItems);

  // Stop the previous voice before starting the next: overlapping Karplus-Strong
  // voices sum on the shared guitar bus and can clip into harsh distortion.
  const activeVoiceRef = useRef<PluckHandle | null>(null);
  useEffect(() => () => activeVoiceRef.current?.stop(), []);

  const playString = async (stringIndex: number) => {
    await unlockAudio();
    activeVoiceRef.current?.stop();
    activeVoiceRef.current = getGuitarSynth().pluck(tuning[stringIndex], {
      a4,
      velocity: 0.85,
      brightness: 0.55,
      sustainSeconds: 2.2,
    });
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
      <h3 style={{ fontSize: 13, color: 'var(--string)', margin: 0 }}>動作確認: 弦の音を鳴らす</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 260 }}>
        {tuning.map((midi, i) => (
          <button
            key={i}
            onClick={() => void playString(i)}
            style={{
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--accent)',
            }}
          >
            {6 - i}弦
            <br />
            <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--string)' }}>
              {noteName(midi, { flat: false, solfege: false })}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
