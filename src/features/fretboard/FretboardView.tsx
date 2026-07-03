import { useCallback } from 'react';
import { Fretboard, type FretHighlight } from './Fretboard';
import { useFretboardEngine } from './useFretboardEngine';
import { DegreePanel } from './DegreePanel';
import { ScalePanel } from './ScalePanel';
import { useFretboardStore, type ZoomFrets, type LabelMode } from '../../stores/fretboardStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { resolveTuning } from '../../theory/tuningResolver';
import { fretToMidi, noteName } from '../../theory/pitch';
import { scaleTones } from '../../theory/scales';
import { degreeColor, degreeLabel } from '../../theory/degrees';
import { computePositionBoxes, isFretInBox } from '../../theory/positionBoxes';

const ZOOM_OPTIONS: ZoomFrets[] = [12, 15, 22];
const LABEL_MODE_OPTIONS: { id: LabelMode; label: string }[] = [
  { id: 'none', label: 'なし' },
  { id: 'all', label: 'すべて' },
  { id: 'natural', label: 'ナチュラル' },
  { id: 'tapped', label: 'タップ' },
];

export function FretboardView() {
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const customItems = useCustomTuningsStore((s) => s.items);
  const tuning = resolveTuning(currentTuningId, customItems);
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const leftHanded = useSettingsStore((s) => s.leftHanded);

  const orientation = useFretboardStore((s) => s.stringOrientation);
  const setStringOrientation = useFretboardStore((s) => s.setStringOrientation);
  const zoomFrets = useFretboardStore((s) => s.zoomFrets);
  const setZoomFrets = useFretboardStore((s) => s.setZoomFrets);
  const labelMode = useFretboardStore((s) => s.labelMode);
  const setLabelMode = useFretboardStore((s) => s.setLabelMode);
  const overlayMode = useFretboardStore((s) => s.overlayMode);
  const setOverlayMode = useFretboardStore((s) => s.setOverlayMode);
  const degree = useFretboardStore((s) => s.degree);
  const scale = useFretboardStore((s) => s.scale);
  const scaleLabelMode = useFretboardStore((s) => s.scaleLabelMode);
  const positionBox = useFretboardStore((s) => s.positionBox);

  const engine = useFretboardEngine(tuning);

  const getHighlight = useCallback(
    (tuningIndex: number, fret: number): FretHighlight | null => {
      const midi = fretToMidi(tuningIndex, fret, tuning);
      const pc = ((midi % 12) + 12) % 12;

      if (overlayMode === 'degree') {
        if (degree.rootMidi === null) return null;
        const rootPc = ((degree.rootMidi % 12) + 12) % 12;
        const semitone = (((pc - rootPc) % 12) + 12) % 12;
        if (!degree.degrees.includes(semitone)) return null;
        return { color: degreeColor(semitone), isRoot: semitone === 0, label: degreeLabel(semitone) };
      }

      if (overlayMode === 'scale') {
        const tones = scaleTones(scale.rootPc, scale.scaleId);
        if (!tones.includes(pc)) return null;
        const semitone = (((pc - scale.rootPc) % 12) + 12) % 12;
        const label = scaleLabelMode === 'degree' ? degreeLabel(semitone) : noteName(midi, noteNaming).replace(/\d+$/, '');
        return { color: degreeColor(semitone), isRoot: pc === scale.rootPc, label };
      }

      return null;
    },
    [tuning, overlayMode, degree, scale, scaleLabelMode, noteNaming],
  );

  const isFretDimmed = useCallback(
    (fret: number): boolean => {
      if (overlayMode !== 'scale' || positionBox === 'all') return false;
      const boxes = computePositionBoxes(scale.rootPc, tuning);
      const box = boxes.find((b) => b.index === positionBox);
      if (!box) return false;
      return !isFretInBox(fret, box);
    },
    [overlayMode, positionBox, scale.rootPc, tuning],
  );

  return (
    <div style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setOverlayMode(overlayMode === 'degree' ? 'off' : 'degree')}
          style={toolbarButtonStyle(overlayMode === 'degree')}
        >
          度数
        </button>
        <button
          onClick={() => setOverlayMode(overlayMode === 'scale' ? 'off' : 'scale')}
          style={toolbarButtonStyle(overlayMode === 'scale')}
        >
          スケール
        </button>
        <button
          onClick={() => setStringOrientation(orientation === '1-top' ? '6-top' : '1-top')}
          style={toolbarButtonStyle(false)}
        >
          {orientation === '1-top' ? '1弦が上' : '6弦が上'}
        </button>
      </div>

      <Fretboard
        tuning={tuning}
        orientation={orientation}
        zoomFrets={zoomFrets}
        leftHanded={leftHanded}
        labelMode={labelMode}
        noteNaming={noteNaming}
        getHighlight={getHighlight}
        isFretDimmed={isFretDimmed}
        activeGlows={engine.activeGlows}
        tappedPositions={engine.tappedPositions}
        svgRef={engine.svgRef}
        onPointerDown={engine.handlePointerDown}
        onPointerMove={engine.handlePointerMove}
        onPointerUp={engine.handlePointerUp}
        onPointerCancel={engine.handlePointerCancel}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--line)' }}>表示フレット</span>
        {ZOOM_OPTIONS.map((z) => (
          <button key={z} onClick={() => setZoomFrets(z)} style={toolbarButtonStyle(zoomFrets === z)}>
            {z}F
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--line)' }}>音名ラベル</span>
        {LABEL_MODE_OPTIONS.map((opt) => (
          <button key={opt.id} onClick={() => setLabelMode(opt.id)} style={toolbarButtonStyle(labelMode === opt.id)}>
            {opt.label}
          </button>
        ))}
      </div>

      {overlayMode === 'degree' && <DegreePanel />}
      {overlayMode === 'scale' && <ScalePanel />}
    </div>
  );
}

function toolbarButtonStyle(active: boolean) {
  return {
    minHeight: 40,
    padding: '0 14px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--string)',
    fontSize: 13,
  };
}
