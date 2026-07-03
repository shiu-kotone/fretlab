import { useFretboardStore } from '../../stores/fretboardStore';
import { DEGREE_LABELS, DEGREE_PRESETS, degreeColor } from '../../theory/degrees';
import { noteName } from '../../theory/pitch';
import { useSettingsStore } from '../../stores/settingsStore';

export function DegreePanel() {
  const degree = useFretboardStore((s) => s.degree);
  const toggleDegree = useFretboardStore((s) => s.toggleDegree);
  const setDegreesFromPreset = useFretboardStore((s) => s.setDegreesFromPreset);
  const clearDegrees = useFretboardStore((s) => s.clearDegrees);
  const noteNaming = useSettingsStore((s) => s.noteNaming);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--string)' }}>
        {degree.rootMidi === null
          ? '指板をタップしてルートを設定してください'
          : `ルート: ${noteName(degree.rootMidi, noteNaming)}(長押しで変更)`}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DEGREE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setDegreesFromPreset(preset.degrees)}
            disabled={degree.rootMidi === null}
            style={chipStyle(false)}
          >
            {preset.label}
          </button>
        ))}
        <button onClick={clearDegrees} style={{ ...chipStyle(false), color: 'var(--warn)', borderColor: 'var(--warn)' }}>
          クリア
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DEGREE_LABELS.map((label, semitone) => {
          const active = degree.degrees.includes(semitone);
          return (
            <button
              key={label}
              onClick={() => toggleDegree(semitone)}
              disabled={degree.rootMidi === null}
              style={{
                ...chipStyle(active),
                background: active ? degreeColor(semitone) : 'var(--surface)',
                borderColor: active ? degreeColor(semitone) : 'var(--line)',
                color: active ? 'var(--bg)' : 'var(--string)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function chipStyle(active: boolean) {
  return {
    minHeight: 36,
    padding: '0 12px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--string)',
    fontSize: 13,
  };
}
