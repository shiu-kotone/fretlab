import { useEffect, useState } from 'react';

/** SPEC §5.8 "アプリ情報": version, offline support status, and a permanent home-screen-add guide (the one-time banner is OnboardingBanner). */
export function AboutSection() {
  const [swActive, setSwActive] = useState(false);

  useEffect(() => {
    navigator.serviceWorker?.getRegistration().then((reg) => setSwActive(!!reg?.active));
  }, []);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={headingStyle}>アプリ情報</h3>
      <p style={rowText}>バージョン: {__APP_VERSION__}</p>
      <p style={rowText}>オフライン対応: {swActive ? '有効(Service Worker登録済み)' : '準備中(初回読み込み後に有効化されます)'}</p>

      <div style={{ fontSize: 12, color: 'var(--string)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ margin: 0 }}>ホーム画面に追加する方法(Safari):</p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>画面下部の共有ボタンをタップ</li>
          <li>「ホーム画面に追加」を選択</li>
          <li>「追加」をタップすると、フルスクリーンのアプリとして起動できます</li>
        </ol>
      </div>
    </section>
  );
}

const headingStyle = { fontSize: 13, color: 'var(--string)', margin: 0 };
const rowText = { fontSize: 12, color: 'var(--line)', margin: 0 };
