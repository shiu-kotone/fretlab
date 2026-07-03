import { useEffect, useState } from 'react';
import { useSettingsStore, type ThemePreference } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { TUNING_PRESETS, CUSTOM_TUNING_MAX_OFFSET } from '../../data/tunings';
import { REGULAR_TUNING, noteName } from '../../theory/pitch';
import { resolveTuningName, isRegularTuning } from '../../theory/tuningResolver';

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: '端末に追従' },
  { id: 'dark', label: 'ダーク' },
  { id: 'light', label: 'ライト' },
];

export function SettingsPanel() {
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const setLeftHanded = useSettingsStore((s) => s.setLeftHanded);
  const a4 = useSettingsStore((s) => s.a4);
  const setA4 = useSettingsStore((s) => s.setA4);
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const setNoteNaming = useSettingsStore((s) => s.setNoteNaming);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const setCurrentTuningId = useSettingsStore((s) => s.setCurrentTuningId);

  const customItems = useCustomTuningsStore((s) => s.items);
  const loaded = useCustomTuningsStore((s) => s.loaded);
  const loadCustomTunings = useCustomTuningsStore((s) => s.load);
  const addCustomTuning = useCustomTuningsStore((s) => s.add);
  const removeCustomTuning = useCustomTuningsStore((s) => s.remove);

  useEffect(() => {
    if (!loaded) void loadCustomTunings();
  }, [loaded, loadCustomTunings]);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [offsets, setOffsets] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const resetCustomForm = () => {
    setCustomName('');
    setOffsets([0, 0, 0, 0, 0, 0]);
    setShowCustomForm(false);
  };

  const saveCustomTuning = async () => {
    const name = customName.trim() || 'カスタム';
    const tuning = REGULAR_TUNING.map((m, i) => m + offsets[i]);
    const id = await addCustomTuning(name, tuning);
    setCurrentTuningId(id);
    resetCustomForm();
  };

  return (
    <div style={{ padding: '8px 0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ margin: 0, color: 'var(--string)' }}>設定</h2>

      <section style={sectionStyle}>
        <label style={rowStyle}>
          <span>左利きモード</span>
          <input type="checkbox" checked={leftHanded} onChange={(e) => setLeftHanded(e.target.checked)} />
        </label>
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>チューニング</h3>
        <select
          value={currentTuningId}
          onChange={(e) => setCurrentTuningId(e.target.value)}
          style={selectStyle}
        >
          <optgroup label="プリセット">
            {TUNING_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          {customItems.length > 0 && (
            <optgroup label="カスタム">
              {customItems.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {!isRegularTuning(currentTuningId) && (
          <p style={noteStyle}>ダイアグラムはレギュラー基準です(§4.2)。</p>
        )}

        {customItems.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {customItems.map((c) => (
              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>{c.name}</span>
                <button style={smallButtonStyle} onClick={() => removeCustomTuning(c.id)} aria-label={`${c.name}を削除`}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}

        {!showCustomForm ? (
          <button style={smallButtonStyle} onClick={() => setShowCustomForm(true)}>
            カスタムチューニングを作成
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
            <input
              type="text"
              placeholder="名前"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offsets.map((offset, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--string)' }}>{6 - i}弦</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      style={stepperButtonStyle}
                      onClick={() =>
                        setOffsets((o) => o.map((v, j) => (j === i ? Math.max(-CUSTOM_TUNING_MAX_OFFSET, v - 1) : v)))
                      }
                      aria-label={`${6 - i}弦を下げる`}
                    >
                      −
                    </button>
                    <span className="tabular-nums" style={{ minWidth: 44, textAlign: 'center', fontSize: 12 }}>
                      {noteName(REGULAR_TUNING[i] + offset, { flat: false, solfege: false })}
                    </span>
                    <button
                      style={stepperButtonStyle}
                      onClick={() =>
                        setOffsets((o) => o.map((v, j) => (j === i ? Math.min(CUSTOM_TUNING_MAX_OFFSET, v + 1) : v)))
                      }
                      aria-label={`${6 - i}弦を上げる`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={smallButtonStyle} onClick={() => void saveCustomTuning()}>
                保存
              </button>
              <button style={smallButtonStyle} onClick={resetCustomForm}>
                キャンセル
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>基準ピッチ</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={stepperButtonStyle} aria-label="基準ピッチを下げる" onClick={() => setA4(a4 - 1)}>
            −
          </button>
          <span className="tabular-nums">A4 = {a4}Hz</span>
          <button style={stepperButtonStyle} aria-label="基準ピッチを上げる" onClick={() => setA4(a4 + 1)}>
            +
          </button>
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>音名表記</h3>
        <label style={rowStyle}>
          <span>ドレミ表記</span>
          <input
            type="checkbox"
            checked={noteNaming.solfege}
            onChange={(e) => setNoteNaming({ solfege: e.target.checked })}
          />
        </label>
        <label style={rowStyle}>
          <span>♭表記(既定は♯)</span>
          <input type="checkbox" checked={noteNaming.flat} onChange={(e) => setNoteNaming({ flat: e.target.checked })} />
        </label>
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>テーマ</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              style={{
                ...smallButtonStyle,
                border: `1px solid ${theme === opt.id ? 'var(--accent)' : 'var(--line)'}`,
                background: theme === opt.id ? 'var(--accent)' : 'var(--surface)',
                color: theme === opt.id ? 'var(--bg)' : 'var(--string)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <p style={{ fontSize: 11, color: 'var(--line)' }}>
        現在のチューニング: {resolveTuningName(currentTuningId, customItems)}
      </p>
    </div>
  );
}

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
  borderBottom: '1px solid var(--line)',
  paddingBottom: 16,
};

const headingStyle = { fontSize: 13, color: 'var(--string)', margin: 0 };

const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const selectStyle = {
  minHeight: 44,
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
  padding: '0 8px',
};

const smallButtonStyle = {
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
};

const stepperButtonStyle = {
  minWidth: 36,
  minHeight: 36,
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
};

const noteStyle = { fontSize: 11, color: 'var(--warn)', margin: 0 };
