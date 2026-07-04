import { useFretboardStore } from '../../stores/fretboardStore';
import { DEGREE_LABELS, DEGREE_PRESETS, degreeColor } from '../../theory/degrees';
import { noteName } from '../../theory/pitch';
import { useSettingsStore } from '../../stores/settingsStore';
import { Chip } from '../../components/ui/Chip';

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
          <Chip key={preset.id} onClick={() => setDegreesFromPreset(preset.degrees)} disabled={degree.rootMidi === null}>
            {preset.label}
          </Chip>
        ))}
        <Chip onClick={clearDegrees} style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}>
          クリア
        </Chip>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DEGREE_LABELS.map((label, semitone) => {
          const active = degree.degrees.includes(semitone);
          return (
            <Chip
              key={label}
              active={active}
              onClick={() => toggleDegree(semitone)}
              disabled={degree.rootMidi === null}
              style={active ? { background: degreeColor(semitone), borderColor: degreeColor(semitone) } : undefined}
            >
              {label}
            </Chip>
          );
        })}
      </div>
    </section>
  );
}
