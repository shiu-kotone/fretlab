import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../../components/ui/Button';

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
      <Button size="small" onClick={() => setHasSeenOnboarding(true)} aria-label="閉じる" style={{ flexShrink: 0 }}>
        閉じる
      </Button>
    </div>
  );
}
