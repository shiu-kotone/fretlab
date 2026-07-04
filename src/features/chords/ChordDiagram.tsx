import type { ReactNode, SVGProps } from 'react';
import type { Voicing } from '../../data/voicingTypes';
import type { ChordTypeId } from '../../theory/chords';
import { REGULAR_TUNING, fretToMidi, noteName } from '../../theory/pitch';
import { degreeLabel } from '../../theory/degrees';
import {
  DIAGRAM_WIDTH,
  STRING_COUNT,
  FRET_COUNT_SHOWN,
  stringX,
  fretRowY,
  fretToRow,
  dotY,
  diagramHeight,
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
}

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

export function ChordDiagram({ voicing, root, typeId, noteNaming, leftHanded }: ChordDiagramProps) {
  void typeId; // reserved for future use (e.g. distinguishing enharmonic degree spellings by chord type)
  const height = diagramHeight();
  const isOpenPosition = voicing.baseFret === 1;
  const groupTransform = leftHanded ? `translate(${DIAGRAM_WIDTH},0) scale(-1,1)` : undefined;

  return (
    <svg viewBox={`0 0 ${DIAGRAM_WIDTH} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g transform={groupTransform}>
        {/* nut or baseFret number */}
        {isOpenPosition ? (
          <rect x={stringX(0) - 3} y={fretRowY(0) - 4} width={stringX(5) - stringX(0) + 6} height={6} fill="var(--string)" />
        ) : (
          <>
            <line x1={stringX(0)} y1={fretRowY(0)} x2={stringX(5)} y2={fretRowY(0)} stroke="var(--line)" strokeWidth={2} />
            <MirroredText
              x={stringX(0) - 14}
              y={fretRowY(0) + 10}
              leftHanded={leftHanded}
              textAnchor="end"
              fontSize={16}
              fill="var(--string)"
            >
              {voicing.baseFret}fr
            </MirroredText>
          </>
        )}

        {/* fret lines */}
        {Array.from({ length: FRET_COUNT_SHOWN }, (_, i) => i + 1).map((row) => (
          <line
            key={`fretline-${row}`}
            x1={stringX(0)}
            y1={fretRowY(row)}
            x2={stringX(5)}
            y2={fretRowY(row)}
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}

        {/* strings */}
        {Array.from({ length: STRING_COUNT }, (_, s) => s).map((s) => (
          <line
            key={`string-${s}`}
            x1={stringX(s)}
            y1={fretRowY(0)}
            x2={stringX(s)}
            y2={fretRowY(FRET_COUNT_SHOWN)}
            stroke="var(--string)"
            strokeWidth={1.5}
          />
        ))}

        {/* barres */}
        {voicing.barres?.map((barre, i) => {
          const row = fretToRow(barre.fret, voicing.baseFret);
          if (row === null) return null;
          const y = dotY(row);
          const x1 = stringX(barre.fromString);
          const x2 = stringX(barre.toString);
          return (
            <line
              key={`barre-${i}`}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="var(--accent)"
              strokeWidth={16}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}

        {/* per-string markers: x / o / fretted dot, and note+degree label below */}
        {voicing.frets.map((fret, s) => {
          const x = stringX(s);
          if (fret === 'x') {
            return (
              <MirroredText
                key={`mark-${s}`}
                x={x}
                y={fretRowY(0) - 14}
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
            return <circle key={`mark-${s}`} cx={x} cy={fretRowY(0) - 16} r={8} fill="none" stroke="var(--string)" strokeWidth={2} />;
          }
          const row = fretToRow(fret, voicing.baseFret);
          if (row === null) return null;
          const y = dotY(row);
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

        {/* note name + degree, below the grid */}
        {voicing.frets.map((fret, s) => {
          if (fret === 'x') return null;
          const midi = fretToMidi(s, fret, REGULAR_TUNING);
          const pc = ((midi % 12) + 12) % 12;
          const semitone = ((pc - root) % 12 + 12) % 12;
          const x = stringX(s);
          const labelY = fretRowY(FRET_COUNT_SHOWN) + 26;
          return (
            <g key={`label-${s}`}>
              <MirroredText x={x} y={labelY} leftHanded={leftHanded} textAnchor="middle" fontSize={15} fill="var(--string)">
                {noteName(midi, noteNaming).replace(/\d+$/, '')}
              </MirroredText>
              <MirroredText x={x} y={labelY + 20} leftHanded={leftHanded} textAnchor="middle" fontSize={13} fill="var(--accent)">
                {degreeLabel(semitone)}
              </MirroredText>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
