import { useSettingsStore } from '../stores/settingsStore';

/**
 * Best-effort screen wake lock while playback is active (SPEC §4.4); failure
 * (unsupported browser, setting disabled, OS battery saver, ...) is never
 * fatal to playback.
 *
 * The OS releases the lock automatically on backgrounding (POLISH.md R4-2),
 * without clearing whatever reference the caller is holding — so this wires
 * up the sentinel's own 'release' event to null out `ref.current`, letting a
 * caller's visibilitychange handler tell "still held" apart from "needs
 * reacquiring" with a plain truthiness check.
 */
export function acquireWakeLock(ref: { current: WakeLockSentinel | null }): void {
  if (!useSettingsStore.getState().wakeLockEnabled || !('wakeLock' in navigator)) return;
  navigator.wakeLock
    .request('screen')
    .then((sentinel) => {
      ref.current = sentinel;
      sentinel.addEventListener('release', () => {
        if (ref.current === sentinel) ref.current = null;
      });
    })
    .catch(() => {
      // Not fatal: playback continues without the lock.
    });
}
