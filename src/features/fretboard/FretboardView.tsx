import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useActivityTimeTracker } from '../practiceLog/useActivityTimeTracker';
import { Chip } from '../../components/ui/Chip';

const ZOOM_OPTIONS: ZoomFrets[] = [12, 15, 22];
const LABEL_MODE_OPTIONS: { id: LabelMode; label: string }[] = [
  { id: 'none', label: 'なし' },
  { id: 'all', label: 'すべて' },
  { id: 'natural', label: 'ナチュラル' },
  { id: 'tapped', label: 'タップ' },
];

/** SPEC §3.2: "横向きは指板タブのみ最適化(全フレット表示)". */
function useIsLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches,
  );
  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)');
    const apply = () => setIsLandscape(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);
  return isLandscape;
}

export function FretboardView() {
  useActivityTimeTracker('fretboard');
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
  const isLandscape = useIsLandscape();

  // Auto-switch to showing all 22 frets on entering landscape, the one time
  // it matters most (a still-at-default 12F view) — doesn't fight a zoom
  // level the user has already deliberately chosen.
  const hasAutoZoomed = useRef(false);
  useEffect(() => {
    if (isLandscape && !hasAutoZoomed.current && zoomFrets === 12) {
      hasAutoZoomed.current = true;
      setZoomFrets(22);
    }
  }, [isLandscape, zoomFrets, setZoomFrets]);

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
    <div
      style={{
        padding: isLandscape ? '6px 10px 24px' : '8px 16px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: isLandscape ? 6 : 12,
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip active={overlayMode === 'degree'} style={compactChipStyle(isLandscape)} onClick={() => setOverlayMode(overlayMode === 'degree' ? 'off' : 'degree')}>
          度数
        </Chip>
        <Chip active={overlayMode === 'scale'} style={compactChipStyle(isLandscape)} onClick={() => setOverlayMode(overlayMode === 'scale' ? 'off' : 'scale')}>
          スケール
        </Chip>
        <Chip style={compactChipStyle(isLandscape)} onClick={() => setStringOrientation(orientation === '1-top' ? '6-top' : '1-top')}>
          {orientation === '1-top' ? '1弦が上' : '6弦が上'}
        </Chip>
      </div>

      {/* SPEC §3.2 "横向きは指板タブのみ最適化(全フレット表示)": the fretboard
          gets a generous, orientation-aware DEFINITE height (min-height
          alone is only a floor — the SVG's own aspect ratio would just push
          the container taller than intended, unconstrained), and the SVG
          (preserveAspectRatio, width/height 100%) scales up to fill it —
          maximizing the tappable area in both orientations, landscape especially. */}
      <div
        style={{
          height: isLandscape ? '68vh' : '42vh',
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
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
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--line)' }}>表示フレット</span>
        {ZOOM_OPTIONS.map((z) => (
          <Chip key={z} active={zoomFrets === z} style={compactChipStyle(isLandscape)} onClick={() => setZoomFrets(z)}>
            {z}F
          </Chip>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--line)' }}>音名ラベル</span>
        {LABEL_MODE_OPTIONS.map((opt) => (
          <Chip key={opt.id} active={labelMode === opt.id} style={compactChipStyle(isLandscape)} onClick={() => setLabelMode(opt.id)}>
            {opt.label}
          </Chip>
        ))}
      </div>

      {overlayMode === 'degree' && <DegreePanel />}
      {overlayMode === 'scale' && <ScalePanel />}
    </div>
  );
}

/**
 * Landscape drops to a 32pt-tall compact chip (below the 44pt touch-target
 * guideline) — a deliberate trade for vertical space in the one orientation
 * SPEC §3.2 calls out for "全フレット表示" (maximize the fretboard itself);
 * portrait stays at the standard 44pt.
 */
function compactChipStyle(compact: boolean) {
  return compact ? { minHeight: 32, padding: '0 10px', fontSize: 12 } : undefined;
}
