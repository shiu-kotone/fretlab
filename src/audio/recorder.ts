/** SPEC §5.6: max 30 minutes per recording. */
export const MAX_RECORDING_SECONDS = 30 * 60;

/** SPEC §5.6 mimeType fallback order: audio/mp4 (Safari/iOS) then audio/webm (Chrome/Android). */
const MIME_TYPE_CANDIDATES = ['audio/mp4', 'audio/webm'];

/** Takes `MediaRecorder.isTypeSupported` as a parameter so this is testable without a real MediaRecorder. */
export function pickRecorderMimeType(isSupported: (mimeType: string) => boolean): string | null {
  return MIME_TYPE_CANDIDATES.find((type) => isSupported(type)) ?? null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** SPEC §5.6 default name: "録音 YYYY-MM-DD HH:mm". */
export function defaultRecordingName(date: Date): string {
  const y = date.getFullYear();
  const mo = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const mi = pad2(date.getMinutes());
  return `録音 ${y}-${mo}-${d} ${h}:${mi}`;
}

/** mm:ss (sufficient up to the 30-minute cap; falls back to h:mm:ss beyond that). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${minutes}:${pad2(seconds)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)}MB`;
}
