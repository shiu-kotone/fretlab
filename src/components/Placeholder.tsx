interface Props {
  title: string;
}

export function Placeholder({ title }: Props) {
  return (
    <div style={{ padding: 24, color: 'var(--line)' }}>
      <h2 style={{ color: 'var(--string)' }}>{title}</h2>
      <p>この機能は今後のPhaseで実装予定です。</p>
    </div>
  );
}
