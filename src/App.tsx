import { useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { MetronomeView } from './features/metronome/MetronomeView';
import { FretboardView } from './features/fretboard/FretboardView';
import { ChordTabView } from './features/chords/ChordTabView';
import { TunerView } from './features/tuner/TunerView';
import { LabView } from './features/settings/LabView';
import { useMetronomeStore } from './stores/metronomeStore';
import { useSettingsStore, resolveThemeMode } from './stores/settingsStore';
import { useCustomTuningsStore } from './stores/customTuningsStore';
import { useNavigationStore } from './stores/navigationStore';
import { usePlaybackCoordinatorStore } from './stores/playbackCoordinatorStore';
import { resolveTuningName } from './theory/tuningResolver';
import { unlockAudio, setGuitarVolume, setClickVolume } from './audio/AudioEngine';
import { OnboardingBanner } from './features/settings/OnboardingBanner';
import { useLabTabStore } from './features/settings/LabView';

export default function App() {
  const tab = useNavigationStore((s) => s.activeTab);
  const setTab = useNavigationStore((s) => s.setActiveTab);
  const isPlaying = useMetronomeStore((s) => s.isPlaying);
  const progressionPlaying = usePlaybackCoordinatorStore((s) => s.activeOwner === 'progression');
  const setLabSegment = useLabTabStore((s) => s.setSegment);

  const theme = useSettingsStore((s) => s.theme);
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const guitarVolume = useSettingsStore((s) => s.guitarVolume);
  const clickVolume = useSettingsStore((s) => s.clickVolume);
  const customTunings = useCustomTuningsStore((s) => s.items);
  const loadCustomTunings = useCustomTuningsStore((s) => s.load);

  useEffect(() => {
    void loadCustomTunings();
  }, [loadCustomTunings]);

  // SPEC §5.8: guitar/click volume are global settings shared by every feature's audio.
  useEffect(() => {
    setGuitarVolume(guitarVolume);
  }, [guitarVolume]);
  useEffect(() => {
    setClickVolume(clickVolume);
  }, [clickVolume]);

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
        <button
          onClick={() => {
            setLabSegment('settings');
            setTab('lab');
          }}
          aria-label="設定を開く"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            padding: '0 4px',
            border: 'none',
            background: 'transparent',
            fontSize: 12,
            color: 'var(--string)',
          }}
        >
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
          <GearIcon />
        </button>
      </header>
      <OnboardingBanner />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* MetronomeView and ChordTabView (progression playback) stay mounted
            across tab switches so their audio scheduling is never torn down —
            SPEC §3.1 "タブ切替時も再生中の音... は止めない". Inactive tabs are
            hidden via CSS, not unmounted. */}
        <div style={{ display: tab === 'metronome' ? 'block' : 'none', height: '100%' }}>
          <MetronomeView />
        </div>
        <div style={{ display: tab === 'chords' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <ChordTabView />
        </div>
        {tab === 'fretboard' && <FretboardView />}
        {tab === 'tuner' && <TunerView />}
        {tab === 'lab' && <LabView />}
      </main>
      <TabBar active={tab} onChange={setTab} badges={{ metronome: isPlaying, chords: progressionPlaying }} />
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
