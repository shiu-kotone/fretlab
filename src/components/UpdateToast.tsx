import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fretlab-last-seen-version';

/**
 * POLISH.md R4-4: `registerType: 'autoUpdate'` swaps in new app code silently,
 * so a deployed update is otherwise invisible. Detected by comparing
 * __APP_VERSION__ against the version recorded at the previous launch —
 * simpler and more robust than hooking into the service worker's own update
 * lifecycle, and equivalent in practice since a version bump only ever ships
 * alongside a new deployment.
 */
export function UpdateToast() {
  const [previousVersion, setPreviousVersion] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== __APP_VERSION__) {
      setPreviousVersion(stored);
    }
    localStorage.setItem(STORAGE_KEY, __APP_VERSION__);
  }, []);

  if (!previousVersion) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        left: 16,
        right: 16,
        background: 'var(--accent)',
        color: 'var(--bg)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>アプリを更新しました(v{__APP_VERSION__})</span>
      <button
        onClick={() => setPreviousVersion(null)}
        aria-label="閉じる"
        style={{ background: 'transparent', border: 'none', color: 'var(--bg)', fontSize: 18, minWidth: 32, minHeight: 32 }}
      >
        ×
      </button>
    </div>
  );
}
