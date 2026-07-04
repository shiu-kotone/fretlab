import type { PointerEvent, ReactNode, RefObject, SVGProps } from 'react';
import type { Midi } from '../../theory/pitch';
import { fretToMidi, noteName, isNaturalPitchClass } from '../../theory/pitch';
import type { StringOrientation, ZoomFrets, LabelMode } from '../../stores/fretboardStore';
import type { ActiveGlow } from './useFretboardEngine';
import {
  VIEW_WIDTH,
  STRING_SPACING,
  TOP_MARGIN,
  STRING_COUNT,
  OPEN_ZONE_WIDTH,
  fretBoundaryX,
  fretCenterX,
  stringY,
  boardHeight,
} from './fretboardGeometry';

const POSITION_DOT_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_DOT_FRET = 12;

export interface FretHighlight {
  color: string;
  isRoot: boolean;
  label: string;
}

interface NoteNaming {
  flat: boolean;
  solfege: boolean;
}

interface FretboardProps {
  tuning: Midi[];
  orientation: StringOrientation;
  zoomFrets: ZoomFrets;
  leftHanded: boolean;
  labelMode: LabelMode;
  noteNaming: NoteNaming;
  getHighlight: (tuningIndex: number, fret: number) => FretHighlight | null;
  isFretDimmed: (fret: number) => boolean;
  activeGlows: Map<string, ActiveGlow>;
  tappedPositions: Set<string>;
  svgRef: RefObject<SVGSVGElement>;
  onPointerDown: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (e: PointerEvent<SVGSVGElement>) => void;
}

function stringStrokeWidth(tuningIndex: number): number {
  // tuningIndex 0 = low E (6th, thickest) .. 5 = high e (1st, thinnest)
  return 1 + (STRING_COUNT - 1 - tuningIndex) * 0.55;
}

function isWoundString(tuningIndex: number): boolean {
  return tuningIndex <= 2; // 6th, 5th, 4th strings
}

/** Renders text un-mirrored even inside a horizontally-flipped left-handed group (SPEC §4.1). */
function MirroredText({
  x,
  y,
  leftHanded,
  children,
  ...rest
}: { x: number; y: number; leftHanded: boolean; children: ReactNode } & SVGProps<SVGTextElement>) {
  if (!leftHanded) {
    return (
      <text x={x} y={y} {...rest}>
        {children}
      </text>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(-1,1)`}>
      <text x={0} y={0} {...rest}>
        {children}
      </text>
    </g>
  );
}

export function Fretboard({
  tuning,
  orientation,
  zoomFrets,
  leftHanded,
  labelMode,
  noteNaming,
  getHighlight,
  isFretDimmed,
  activeGlows,
  tappedPositions,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: FretboardProps) {
  const height = boardHeight();
  const bottomRowY = TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING;

  const shouldShowBaseLabel = (tuningIndex: number, fret: number, midi: Midi): boolean => {
    if (labelMode === 'all') return true;
    if (labelMode === 'natural') return isNaturalPitchClass(midi);
    if (labelMode === 'tapped') return tappedPositions.has(`${tuningIndex}-${fret}`);
    return false;
  };

  const groupTransform = leftHanded ? `translate(${VIEW_WIDTH},0) scale(-1,1)` : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      style={{
        touchAction: 'none',
        display: 'block',
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${VIEW_WIDTH} / ${height}`,
        background: 'var(--surface)',
        borderRadius: 8,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <g transform={groupTransform}>
        {/* open-string zone */}
        <rect x={0} y={TOP_MARGIN} width={OPEN_ZONE_WIDTH} height={(STRING_COUNT - 1) * STRING_SPACING} fill="var(--bg)" opacity={0.4} />


        {/* position marks */}
        {Array.from({ length: zoomFrets }, (_, i) => i + 1).map((fret) => {
          const cx = fretCenterX(fret, zoomFrets);
          const cy = bottomRowY + 34;
          if (fret === DOUBLE_DOT_FRET) {
            return (
              <g key={`mark-${fret}`}>
                <circle cx={cx - 14} cy={cy} r={8} fill="var(--line)" />
                <circle cx={cx + 14} cy={cy} r={8} fill="var(--line)" />
              </g>
            );
          }
          if (POSITION_DOT_FRETS.has(fret)) {
            return <circle key={`mark-${fret}`} cx={cx} cy={cy} r={8} fill="var(--line)" />;
          }
          return null;
        })}

        {/* fret wires */}
        <rect x={OPEN_ZONE_WIDTH - 6} y={TOP_MARGIN} width={6} height={(STRING_COUNT - 1) * STRING_SPACING} fill="var(--string)" />
        {Array.from({ length: zoomFrets }, (_, i) => i + 1).map((fret) => (
          <line
            key={`fret-${fret}`}
            x1={fretBoundaryX(fret, zoomFrets)}
            y1={TOP_MARGIN}
            x2={fretBoundaryX(fret, zoomFrets)}
            y2={bottomRowY}
            stroke="var(--line)"
            strokeWidth={2}
          />
        ))}

        {/* strings */}
        {tuning.map((_, tuningIndex) => (
          <line
            key={`string-${tuningIndex}`}
            x1={0}
            y1={stringY(tuningIndex, orientation)}
            x2={VIEW_WIDTH}
            y2={stringY(tuningIndex, orientation)}
            stroke="var(--string)"
            strokeWidth={stringStrokeWidth(tuningIndex)}
            strokeDasharray={isWoundString(tuningIndex) ? '3 1' : undefined}
            opacity={isWoundString(tuningIndex) ? 0.85 : 1}
          />
        ))}

        {/* open string labels */}
        {tuning.map((midi, tuningIndex) => (
          <MirroredText
            key={`open-${tuningIndex}`}
            x={OPEN_ZONE_WIDTH / 2}
            y={stringY(tuningIndex, orientation) + 8}
            leftHanded={leftHanded}
            textAnchor="middle"
            fontSize={22}
            fill="var(--string)"
          >
            {noteName(midi, noteNaming).replace(/\d+$/, '')}
          </MirroredText>
        ))}

        {/* fret number labels */}
        {Array.from({ length: zoomFrets }, (_, i) => i + 1)
          .filter((fret) => POSITION_DOT_FRETS.has(fret) || fret === DOUBLE_DOT_FRET)
          .map((fret) => (
            <MirroredText
              key={`fretnum-${fret}`}
              x={fretCenterX(fret, zoomFrets)}
              y={height - 20}
              leftHanded={leftHanded}
              textAnchor="middle"
              fontSize={20}
              fill="var(--line)"
            >
              {fret}
            </MirroredText>
          ))}

        {/* notes: highlight dots / base labels / active glow */}
        {tuning.map((_, tuningIndex) =>
          Array.from({ length: zoomFrets + 1 }, (_, fret) => fret).map((fret) => {
            const midi = fretToMidi(tuningIndex, fret, tuning);
            const pc = ((midi % 12) + 12) % 12;
            const cx = fretCenterX(fret, zoomFrets);
            const cy = stringY(tuningIndex, orientation);
            const key = `${tuningIndex}-${fret}`;
            const highlight = getHighlight(tuningIndex, fret);
            const glow = activeGlows.get(key);
            const dimmed = fret > 0 && isFretDimmed(fret);

            return (
              <g key={key} opacity={dimmed ? 0.2 : 1}>
                {glow && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={highlight ? 30 : 24}
                    fill="none"
                    stroke={glow.kind === 'muted' ? 'var(--line)' : 'var(--accent)'}
                    strokeWidth={4}
                    opacity={0.9}
                  />
                )}
                {highlight ? (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={highlight.isRoot ? 26 : 22}
                      fill={highlight.color}
                      stroke={highlight.isRoot ? 'var(--accent)' : 'none'}
                      strokeWidth={3}
                    />
                    <MirroredText x={cx} y={cy + 7} leftHanded={leftHanded} textAnchor="middle" fontSize={19} fill="var(--bg)">
                      {highlight.label}
                    </MirroredText>
                  </>
                ) : (
                  // fret 0 is skipped here — its note name is already shown once in the
                  // open-string zone label; repeating it here (SPEC §4.6's "natural" mode
                  // in particular) drew the same letter twice on top of each other.
                  fret > 0 &&
                  shouldShowBaseLabel(tuningIndex, fret, pc) && (
                    <MirroredText x={cx} y={cy - 18} leftHanded={leftHanded} textAnchor="middle" fontSize={18} fill="var(--string)">
                      {noteName(midi, noteNaming).replace(/\d+$/, '')}
                    </MirroredText>
                  )
                )}
              </g>
            );
          }),
        )}
      </g>
    </svg>
  );
}
