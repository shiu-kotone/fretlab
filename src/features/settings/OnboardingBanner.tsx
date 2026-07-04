import { useSettingsStore } from '../../stores/settingsStore';

/** SPEC §5.8: shown once on first launch, guiding the user to add the PWA to the home screen. */
export function OnboardingBanner() {
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const setHasSeenOnboarding = useSettingsStore((s) => s.setHasSeenOnboarding);

  if (hasSeenOnboarding) return null;

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--accent)', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--string)', flex: 1 }}>
        Safariの共有ボタン→「ホーム画面に追加」でアプリのように起動できます(オフラインでも使用可)。手順は設定に常時掲載しています。
      </p>
      <button
        onClick={() => setHasSeenOnboarding(true)}
        aria-label="閉じる"
        style={{ minWidth: 44, minHeight: 32, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg)', color: 'var(--string)', fontSize: 12, flexShrink: 0 }}
      >
        閉じる
      </button>
    </div>
  );
}
