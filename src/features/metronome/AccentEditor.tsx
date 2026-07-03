import type { AccentState } from '../../audio/beatPlan';
import { useMetronomeStore } from '../../stores/metronomeStore';
import type { BeatFlash } from './useMetronomeEngine';

const DOT_COLOR: Record<AccentState, string> = {
  accent: 'var(--accent)',
  normal: 'var(--string)',
  mute: 'var(--line)',
};

interface Props {
  flash: BeatFlash | null;
}

export function AccentEditor({ flash }: Props) {
  const accentPattern = useMetronomeStore((s) => s.accentPattern);
  const cycleAccentAt = useMetronomeStore((s) => s.cycleAccentAt);

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '16px 8px', flexWrap: 'wrap' }}>
      {accentPattern.map((state, i) => {
        const isCurrent = flash?.isMainBeat && flash.beatIndex === i;
        return (
          <button
            key={i}
            onClick={() => cycleAccentAt(i)}
            aria-label={`拍${i + 1}: ${state}`}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `2px solid ${state === 'accent' ? 'var(--accent)' : 'var(--line)'}`,
              background: DOT_COLOR[state],
              opacity: state === 'mute' ? 0.4 : 1,
              transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
              boxShadow: isCurrent ? '0 0 12px var(--accent)' : 'none',
              transition: 'transform 80ms ease-out, box-shadow 80ms ease-out',
            }}
          />
        );
      })}
    </div>
  );
}
