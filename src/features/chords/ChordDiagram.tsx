import { useRef, type PointerEvent, type ReactNode, type SVGProps } from 'react';
import type { Voicing } from '../../data/voicingTypes';
import type { ChordTypeId } from '../../theory/chords';
import { REGULAR_TUNING, fretToMidi, noteName } from '../../theory/pitch';
import { degreeLabel } from '../../theory/degrees';
import {
  STRING_COUNT,
  FRET_COUNT_SHOWN,
  stringY,
  gridTopY,
  gridBottomY,
  fretColX,
  fretToCol,
  dotX,
  stringNumberX,
  stringNumberLabel,
  markX,
  labelX,
  diagramWidth,
  diagramHeight,
  interpretSwipe,
} from './chordDiagramGeometry';

interface NoteNaming {
  flat: boolean;
  solfege: boolean;
}

interface ChordDiagramProps {
  voicing: Voicing;
  root: number;
  typeId: ChordTypeId;
  noteNaming: NoteNaming;
  leftHanded: boolean;
  /** POLISH.md R4-1: horizontal swipe switches to the previous/next voicing. */
  onSwipeVoicing?: (direction: 'prev' | 'next') => void;
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

/**
 * Horizontal neck layout, matching the fretboard feature's orientation: nut
 * on the left for right-handed display, mirrored to the right for
 * left-handed (SPEC §4.1's single-group-transform pattern, reused from
 * Fretboard.tsx). String numbers 1-6 sit outside the o/x marks on the nut
 * side so the mute/open state and the physical string are easy to match up.
 */
export function ChordDiagram({ voicing, root, typeId, noteNaming, leftHanded, onSwipeVoicing }: ChordDiagramProps) {
  void typeId; // reserved for future use (e.g. distinguishing enharmonic degree spellings by chord type)
  const width = diagramWidth();
  const height = diagramHeight();
  const isOpenPosition = voicing.baseFret === 1;
  const groupTransform = leftHanded ? `translate(${width},0) scale(-1,1)` : undefined;

  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!onSwipeVoicing) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || !onSwipeVoicing) return;
    const direction = interpretSwipe(e.clientX - start.x, e.clientY - start.y);
    if (direction) onSwipeVoicing(direction);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block', touchAction: onSwipeVoicing ? 'pan-y' : undefined }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <g transform={groupTransform}>
        {/* nut or baseFret number */}
        {isOpenPosition ? (
          <rect x={fretColX(0) - 3} y={gridTopY() - 4} width={6} height={gridBottomY() - gridTopY() + 8} fill="var(--string)" />
        ) : (
          <>
            <line x1={fretColX(0)} y1={gridTopY()} x2={fretColX(0)} y2={gridBottomY()} stroke="var(--line)" strokeWidth={2} />
            <MirroredText
              x={fretColX(0)}
              y={gridTopY() - 12}
              leftHanded={leftHanded}
              textAnchor="start"
              fontSize={16}
              fill="var(--string)"
            >
              {voicing.baseFret}fr
            </MirroredText>
          </>
        )}

        {/* fret lines */}
        {Array.from({ length: FRET_COUNT_SHOWN }, (_, i) => i + 1).map((col) => (
          <line
            key={`fretline-${col}`}
            x1={fretColX(col)}
            y1={gridTopY()}
            x2={fretColX(col)}
            y2={gridBottomY()}
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}

        {/* strings */}
        {Array.from({ length: STRING_COUNT }, (_, s) => s).map((s) => (
          <line
            key={`string-${s}`}
            x1={fretColX(0)}
            y1={stringY(s)}
            x2={fretColX(FRET_COUNT_SHOWN)}
            y2={stringY(s)}
            stroke="var(--string)"
            strokeWidth={1.5}
          />
        ))}

        {/* string numbers, outside the o/x marks on the nut side */}
        {Array.from({ length: STRING_COUNT }, (_, s) => s).map((s) => (
          <MirroredText
            key={`stringnum-${s}`}
            x={stringNumberX()}
            y={stringY(s) + 4}
            leftHanded={leftHanded}
            textAnchor="middle"
            fontSize={12}
            fill="var(--line)"
          >
            {stringNumberLabel(s)}
          </MirroredText>
        ))}

        {/* barres */}
        {voicing.barres?.map((barre, i) => {
          const col = fretToCol(barre.fret, voicing.baseFret);
          if (col === null) return null;
          const x = dotX(col);
          const y1 = stringY(barre.fromString);
          const y2 = stringY(barre.toString);
          return (
            <line
              key={`barre-${i}`}
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              stroke="var(--accent)"
              strokeWidth={16}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}

        {/* per-string markers: x / o / fretted dot */}
        {voicing.frets.map((fret, s) => {
          const y = stringY(s);
          if (fret === 'x') {
            return (
              <MirroredText
                key={`mark-${s}`}
                x={markX()}
                y={y + 6}
                leftHanded={leftHanded}
                textAnchor="middle"
                fontSize={18}
                fill="var(--warn)"
              >
                ×
              </MirroredText>
            );
          }
          if (fret === 0) {
            return <circle key={`mark-${s}`} cx={markX()} cy={y} r={8} fill="none" stroke="var(--string)" strokeWidth={2} />;
          }
          const col = fretToCol(fret, voicing.baseFret);
          if (col === null) return null;
          const x = dotX(col);
          const finger = voicing.fingers?.[s];
          return (
            <g key={`mark-${s}`}>
              <circle cx={x} cy={y} r={14} fill="var(--accent)" />
              {finger ? (
                <MirroredText x={x} y={y + 5} leftHanded={leftHanded} textAnchor="middle" fontSize={14} fill="var(--bg)">
                  {finger}
                </MirroredText>
              ) : null}
            </g>
          );
        })}

        {/* note name + degree, right of the grid */}
        {voicing.frets.map((fret, s) => {
          if (fret === 'x') return null;
          const midi = fretToMidi(s, fret, REGULAR_TUNING);
          const pc = ((midi % 12) + 12) % 12;
          const semitone = ((pc - root) % 12 + 12) % 12;
          const y = stringY(s);
          return (
            <g key={`label-${s}`}>
              <MirroredText x={labelX()} y={y - 4} leftHanded={leftHanded} textAnchor="middle" fontSize={14} fill="var(--string)">
                {noteName(midi, noteNaming).replace(/\d+$/, '')}
              </MirroredText>
              <MirroredText x={labelX()} y={y + 12} leftHanded={leftHanded} textAnchor="middle" fontSize={12} fill="var(--accent)">
                {degreeLabel(semitone)}
              </MirroredText>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
