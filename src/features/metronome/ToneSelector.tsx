import { useMetronomeStore } from '../../stores/metronomeStore';
import { TONE_IDS, type ToneId } from '../../audio/click';

const TONE_LABELS: Record<ToneId, string> = {
  woodblock: 'ウッドブロック',
  electronicClick: 'クリック(電子)',
  beep: 'ビープ',
  cowbell: 'カウベル',
  rimshot: 'リムショット風',
};

export function ToneSelector() {
  const tone = useMetronomeStore((s) => s.tone);
  const setTone = useMetronomeStore((s) => s.setTone);
  const clickVolume = useMetronomeStore((s) => s.clickVolume);
  const setClickVolume = useMetronomeStore((s) => s.setClickVolume);

  return (
    <section style={{ padding: '8px 16px' }}>
      <h3 style={{ fontSize: 13, color: 'var(--string)', margin: '0 0 8px' }}>音色</h3>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {TONE_IDS.map((id) => {
          const active = tone === id;
          return (
            <button
              key={id}
              onClick={() => setTone(id)}
              style={{
                minHeight: 44,
                padding: '0 14px',
                borderRadius: 8,
                border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                background: active ? 'var(--accent)' : 'var(--surface)',
                color: active ? 'var(--bg)' : 'var(--string)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {TONE_LABELS[id]}
            </button>
          );
        })}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 13, minWidth: 80 }}>クリック音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={clickVolume}
          onChange={(e) => setClickVolume(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span className="tabular-nums" style={{ minWidth: 32, textAlign: 'right' }}>
          {clickVolume}%
        </span>
      </label>
    </section>
  );
}
