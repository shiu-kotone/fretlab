/** Simple RMS level bar; scale factor is tuned by ear against typical mic input, not a calibrated dB meter. */
export function LevelMeter({ level }: { level: number }) {
  const pct = Math.min(100, level * 300 * 100);
  return (
    <div style={{ width: '100%', maxWidth: 280, height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 80ms linear' }} />
    </div>
  );
}
