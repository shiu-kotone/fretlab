import type { InputHTMLAttributes } from 'react';

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** iOS-style switch replacing native checkboxes (POLISH.md R2-1/R2-3: a bare checkbox's native hit box is well under 44pt). */
export function Toggle({ className = '', ...rest }: ToggleProps) {
  return (
    <span className={`toggle ${className}`.trim()}>
      <input type="checkbox" {...rest} />
      <span className="track" />
      <span className="thumb" />
    </span>
  );
}
