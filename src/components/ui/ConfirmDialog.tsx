import { useEffect, useState, type MouseEvent } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app replacement for window.confirm (POLISH.md R2-4), themed and consistent across screens. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-card" onClick={stop} role="alertdialog" aria-modal="true" aria-label={title}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface DoubleConfirmDialogProps {
  open: boolean;
  title: string;
  /** Shown first; confirming advances to `secondMessage` rather than firing onConfirm immediately. */
  firstMessage: string;
  /** Shown after the first confirm; SPEC's "二重確認" for destructive full-clear actions. */
  secondMessage: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Same dialog, shown twice in sequence with an escalating message — the "二重確認" pattern for full-data-clear actions. */
export function DoubleConfirmDialog({ open, title, firstMessage, secondMessage, confirmLabel = '削除', onConfirm, onCancel }: DoubleConfirmDialogProps) {
  const [stage, setStage] = useState<1 | 2>(1);

  useEffect(() => {
    if (open) setStage(1);
  }, [open]);

  return (
    <ConfirmDialog
      open={open}
      title={title}
      message={stage === 1 ? firstMessage : secondMessage}
      confirmLabel={stage === 1 ? '次へ' : confirmLabel}
      danger={stage === 2}
      onCancel={onCancel}
      onConfirm={() => {
        if (stage === 1) setStage(2);
        else onConfirm();
      }}
    />
  );
}
