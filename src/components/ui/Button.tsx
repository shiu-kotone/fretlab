import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'secondary' | 'primary' | 'danger';
export type ButtonSize = 'default' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Shared tap-feedback button (POLISH.md R2-1): every screen's buttons route through this so `:active` scale/brightness feedback and the 44pt minimum are consistent. */
export function Button({ variant = 'secondary', size = 'default', className = '', ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : '';
  const sizeClass = size === 'small' ? 'btn-small' : '';
  const classes = ['btn', variantClass, sizeClass, className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
