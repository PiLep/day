"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Dialogue de confirmation destructif — mobile-first.
 * Focus trap natif via <dialog>, Escape et Annuler ferment sans action.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = "Suppression…",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) {
        el.showModal();
        confirmRef.current?.focus();
      }
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 m-auto w-[min(100%-2.5rem,360px)] rounded-lg border border-border bg-surface p-0 text-ink shadow-lg backdrop:bg-[rgb(24_24_27/45%)] open:flex open:flex-col"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !pending) onCancel();
      }}
    >
      <div className="flex flex-col gap-3 px-5 pt-5 pb-4">
        <h2 id={titleId} className="text-[17px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        <p id={descId} className="text-[13.5px] leading-[1.55] text-ink-2">
          {description}
        </p>
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-md px-4 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-zinc-100 disabled:opacity-60 md:h-10"
          >
            Annuler
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={pending}
            aria-busy={pending || undefined}
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 md:h-10"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
