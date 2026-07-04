import type { ButtonHTMLAttributes } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Selection chip used throughout for horizontal-scroll option rows (root/type/tempo/etc). */
export function Chip({ active = false, className = '', ...rest }: ChipProps) {
  const classes = ['chip', active ? 'active' : '', className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
