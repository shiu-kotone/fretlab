interface Props {
  onRetry: () => void;
}

/** SPEC §5.5: shown when mic permission is denied; mode 2 (reference tone) stays usable regardless. */
export function PermissionGuide({ onRetry }: Props) {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: 'var(--warn)', margin: 0 }}>マイクへのアクセスが許可されていません。</p>
      <div style={{ fontSize: 13, color: 'var(--string)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ margin: 0 }}>iPhoneの「設定」アプリで再許可できます:</p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>「設定」アプリを開く</li>
          <li>「Safari」→「マイク」を開く(ホーム画面に追加した場合は追加したアプリ名を探す)</li>
          <li>このサイトのマイクを「許可」に変更</li>
          <li>このページに戻って下のボタンをもう一度押す</li>
        </ol>
      </div>
      <button
        onClick={onRetry}
        style={{
          alignSelf: 'flex-start',
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 8,
          border: '1px solid var(--accent)',
          background: 'var(--surface)',
          color: 'var(--accent)',
        }}
      >
        もう一度試す
      </button>
      <p style={{ fontSize: 12, color: 'var(--line)', margin: 0 }}>
        マイクなしでも「音出し」モードで耳を頼りにチューニングできます。
      </p>
    </div>
  );
}
