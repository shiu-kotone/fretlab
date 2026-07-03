import { useFretboardStore, type PositionBoxSelection } from '../../stores/fretboardStore';
import { SCALES } from '../../theory/scales';
import { noteName } from '../../theory/pitch';
import { useSettingsStore } from '../../stores/settingsStore';

const ROOT_PITCH_CLASSES = Array.from({ length: 12 }, (_, i) => i);
const BOX_OPTIONS: PositionBoxSelection[] = ['all', 1, 2, 3, 4, 5];

export function ScalePanel() {
  const scale = useFretboardStore((s) => s.scale);
  const setScaleRoot = useFretboardStore((s) => s.setScaleRoot);
  const setScaleType = useFretboardStore((s) => s.setScaleType);
  const scaleLabelMode = useFretboardStore((s) => s.scaleLabelMode);
  const setScaleLabelMode = useFretboardStore((s) => s.setScaleLabelMode);
  const positionBox = useFretboardStore((s) => s.positionBox);
  const setPositionBox = useFretboardStore((s) => s.setPositionBox);
  const noteNaming = useSettingsStore((s) => s.noteNaming);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
      <div>
        <h4 style={headingStyle}>ルート</h4>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {ROOT_PITCH_CLASSES.map((pc) => {
            const active = scale.rootPc === pc;
            return (
              <button key={pc} onClick={() => setScaleRoot(pc)} style={chipStyle(active)}>
                {noteName(60 + pc, noteNaming).replace(/\d+$/, '')}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 style={headingStyle}>スケール</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
          {SCALES.map((s) => {
            const active = scale.scaleId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScaleType(s.id)}
                style={{
                  ...chipStyle(active),
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ ...headingStyle, margin: 0 }}>ラベル</h4>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setScaleLabelMode('degree')} style={chipStyle(scaleLabelMode === 'degree')}>
            度数
          </button>
          <button onClick={() => setScaleLabelMode('note')} style={chipStyle(scaleLabelMode === 'note')}>
            音名
          </button>
        </div>
      </div>

      <div>
        <h4 style={headingStyle}>ポジション</h4>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BOX_OPTIONS.map((box) => (
            <button key={box} onClick={() => setPositionBox(box)} style={chipStyle(positionBox === box)}>
              {box === 'all' ? '全体' : `ボックス${box}`}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const headingStyle = { fontSize: 12, color: 'var(--string)', margin: '0 0 6px' };

function chipStyle(active: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    minHeight: 36,
    padding: '0 12px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--string)',
    fontSize: 13,
    flexShrink: 0,
  };
}
