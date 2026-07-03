import type { CSSProperties } from 'react';

export type TabId = 'fretboard' | 'chords' | 'metronome' | 'tuner' | 'lab';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'fretboard', label: '指板' },
  { id: 'chords', label: 'コード' },
  { id: 'metronome', label: 'リズム' },
  { id: 'tuner', label: 'チューナー' },
  { id: 'lab', label: 'ラボ' },
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
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              position: 'relative',
              flex: 1,
              minHeight: 44,
              padding: '8px 4px',
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--accent)' : 'var(--string)',
              fontSize: 12,
            }}
          >
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
