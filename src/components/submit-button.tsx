"use client";

import { useFormStatus } from "react-dom";

/**
 * Bouton de validation d'un formulaire à server action : affiche l'état
 * d'attente pendant l'envoi et bloque le double-tap. Sans lui, les actions qui
 * passent par Google Calendar laissent croire que le bouton ne répond pas.
 */
export function SubmitButton({
  label,
  pendingLabel,
  disabled = false,
  className = "",
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
