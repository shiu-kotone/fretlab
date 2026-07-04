import { useFretboardStore, type PositionBoxSelection } from '../../stores/fretboardStore';
import { SCALES } from '../../theory/scales';
import { noteName } from '../../theory/pitch';
import { useSettingsStore } from '../../stores/settingsStore';
import { Chip } from '../../components/ui/Chip';

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
          {ROOT_PITCH_CLASSES.map((pc) => (
            <Chip key={pc} active={scale.rootPc === pc} onClick={() => setScaleRoot(pc)}>
              {noteName(60 + pc, noteNaming).replace(/\d+$/, '')}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h4 style={headingStyle}>スケール</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
          {SCALES.map((s) => (
            <Chip key={s.id} active={scale.scaleId === s.id} onClick={() => setScaleType(s.id)} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
              {s.name}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ ...headingStyle, margin: 0 }}>ラベル</h4>
        <div style={{ display: 'flex', gap: 6 }}>
          <Chip active={scaleLabelMode === 'degree'} onClick={() => setScaleLabelMode('degree')}>
            度数
          </Chip>
          <Chip active={scaleLabelMode === 'note'} onClick={() => setScaleLabelMode('note')}>
            音名
          </Chip>
        </div>
      </div>

      <div>
        <h4 style={headingStyle}>ポジション</h4>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BOX_OPTIONS.map((box) => (
            <Chip key={box} active={positionBox === box} onClick={() => setPositionBox(box)}>
              {box === 'all' ? '全体' : `ボックス${box}`}
            </Chip>
          ))}
        </div>
      </div>
    </section>
  );
}

const headingStyle = { fontSize: 12, color: 'var(--string)', margin: '0 0 6px' };
