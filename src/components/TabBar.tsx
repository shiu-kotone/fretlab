import type { CSSProperties, ReactNode, SVGProps } from 'react';

export type TabId = 'fretboard' | 'chords' | 'metronome' | 'tuner' | 'lab';

interface Tab {
  id: TabId;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
}

function iconProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props };
}

function FretboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <line x1="7" y1="4" x2="7" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="17" y1="4" x2="17" y2="20" />
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
    </svg>
  );
}

function ChordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="5" y="4" width="14" height="16" rx="1.5" />
      <line x1="5" y1="10" x2="19" y2="10" />
      <line x1="5" y1="15" x2="19" y2="15" />
      <circle cx="12" cy="12.5" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MetronomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M7 20 L10.5 5 h3 L17 20 Z" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="17" x2="15" y2="7" />
    </svg>
  );
}

function TunerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M9 3v7a3 3 0 0 0 6 0V3" />
      <line x1="12" y1="10" x2="12" y2="21" />
    </svg>
  );
}

function LabIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M10 3h4M9.5 3v6.5l-4.7 8.4a1.8 1.8 0 0 0 1.57 2.68h11.26a1.8 1.8 0 0 0 1.57-2.68l-4.7-8.4V3" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  );
}

const TABS: Tab[] = [
  { id: 'fretboard', label: '指板', icon: FretboardIcon },
  { id: 'chords', label: 'コード', icon: ChordIcon },
  { id: 'metronome', label: 'リズム', icon: MetronomeIcon },
  { id: 'tuner', label: 'チューナー', icon: TunerIcon },
  { id: 'lab', label: 'ラボ', icon: LabIcon },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, boolean>>;
}

const barStyle: CSSProperties = {
  display: 'flex',
  borderTop: '1px solid var(--line)',
  background: 'var(--surface)',
  paddingBottom: 'env(safe-area-inset-bottom)',
};

export function TabBar({ active, onChange, badges }: Props) {
  return (
    <nav style={barStyle}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className="tap-row"
            style={{
              position: 'relative',
              flex: 1,
              minHeight: 52,
              padding: '6px 4px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--accent)' : 'var(--string)',
              fontSize: 11,
            }}
          >
            <Icon />
            {tab.label}
            {badges?.[tab.id] && (
              <span
                aria-label="再生中"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: '30%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
