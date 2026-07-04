export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
}

/** Replaces the 3 near-identical hand-rolled segmented controls (chord ライブラリ/進行, ラボ 録音/記録/設定, tuner マイク/音出し). */
export function SegmentedControl<T extends string>({ options, value, onChange, ...rest }: SegmentedControlProps<T>) {
  return (
    <div className="segmented" role="tablist" {...rest}>
      {options.map((opt) => (
        <button key={opt.id} role="tab" aria-selected={value === opt.id} className={`btn ${value === opt.id ? 'active' : ''}`} onClick={() => onChange(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
