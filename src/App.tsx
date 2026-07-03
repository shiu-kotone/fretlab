import { useEffect, useState } from 'react';
import { TabBar, type TabId } from './components/TabBar';
import { Placeholder } from './components/Placeholder';
import { MetronomeView } from './features/metronome/MetronomeView';
import { FretboardView } from './features/fretboard/FretboardView';
import { TunerView } from './features/tuner/TunerView';
import { LabView } from './features/settings/LabView';
import { useMetronomeStore } from './stores/metronomeStore';
import { useSettingsStore, resolveThemeMode } from './stores/settingsStore';
import { useCustomTuningsStore } from './stores/customTuningsStore';
import { resolveTuningName } from './theory/tuningResolver';
import { unlockAudio } from './audio/AudioEngine';

export default function App() {
  const [tab, setTab] = useState<TabId>('metronome');
  const isPlaying = useMetronomeStore((s) => s.isPlaying);

  const theme = useSettingsStore((s) => s.theme);
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const customTunings = useCustomTuningsStore((s) => s.items);
  const loadCustomTunings = useCustomTuningsStore((s) => s.load);

  useEffect(() => {
    void loadCustomTunings();
  }, [loadCustomTunings]);

  // SPEC §4.6: theme preference resolved here and applied as [data-theme] on
  // <html> so an explicit dark/light choice always wins over the OS setting,
  // while 'system' tracks prefers-color-scheme live.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = resolveThemeMode(theme, mql.matches);
    };
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const handler = () => {
      void unlockAudio();
    };
    window.addEventListener('pointerdown', handler, { once: false });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  const tuningName = resolveTuningName(currentTuningId, customTunings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header
        onClick={() => setTab('lab')}
        role="button"
        aria-label="設定を開く"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          paddingTop: 'calc(8px + env(safe-area-inset-top))',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>FretLab</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--string)' }}>
          <span>{tuningName}</span>
          {leftHanded && (
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
              }}
            >
              左利き
            </span>
          )}
        </span>
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* MetronomeView stays mounted across tab switches so playback (the
            AudioContext-driven scheduler + Wake Lock) is never torn down —
            SPEC §5.4 "再生状態はタブ移動しても継続". Inactive tabs are hidden
            via CSS, not unmounted. */}
        <div style={{ display: tab === 'metronome' ? 'block' : 'none', height: '100%' }}>
          <MetronomeView />
        </div>
        {tab === 'fretboard' && <FretboardView />}
        {tab === 'chords' && <Placeholder title="コード" />}
        {tab === 'tuner' && <TunerView />}
        {tab === 'lab' && <LabView />}
      </main>
      <TabBar active={tab} onChange={setTab} badges={{ metronome: isPlaying }} />
    </div>
  );
}
