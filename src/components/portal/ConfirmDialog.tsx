import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  requireConfirmText?: boolean;
  confirmKeyword?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Yes, Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requireConfirmText = true,
  confirmKeyword = 'delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedKeyword, setTypedKeyword] = useState('');

  // Reset input whenever dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setTypedKeyword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed =
    !requireConfirmText || typedKeyword.trim().toLowerCase() === confirmKeyword.toLowerCase();

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setTypedKeyword('');
    }
  };

  const handleCancel = () => {
    setTypedKeyword('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift text-card-foreground">
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
              variant === 'danger'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50'
            }`}
          >
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-1 text-left">
            <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Mandatory Keyword Confirmation Box */}
        {requireConfirmText && (
          <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              To confirm deletion, please type{' '}
              <span className="font-mono font-extrabold text-destructive px-1.5 py-0.5 rounded bg-destructive/10 lowercase tracking-wide">
                {confirmKeyword}
              </span>{' '}
              below:
            </label>
            <input
              type="text"
              autoFocus
              placeholder={`Type '${confirmKeyword}' to confirm`}
              value={typedKeyword}
              onChange={(e) => setTypedKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmed) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 font-mono"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all ${
              !isConfirmed
                ? 'opacity-40 cursor-not-allowed bg-muted-foreground'
                : variant === 'danger'
                ? 'bg-destructive hover:bg-destructive/90 cursor-pointer active:scale-95'
                : 'bg-amber-600 hover:bg-amber-700 cursor-pointer active:scale-95'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
