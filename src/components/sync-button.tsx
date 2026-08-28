"use client";

import { useState, useTransition } from "react";
import { syncAllTasks } from "@/lib/actions";
import { SyncIcon } from "@/components/icons";

/** Bouton secondaire (§04) — h44 mobile / h40 desktop, bordure toujours visible. */
export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await syncAllTasks();
            } catch {
              setError("Impossible de synchroniser. Vérifiez la connexion et réessayez.");
            }
          })
        }
        disabled={isPending}
        aria-describedby={error ? "sync-error" : undefined}
        title="Pousser les tâches datées vers Google Calendar"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12.5px] font-semibold text-ink shadow-xs transition-colors hover:border-zinc-300 hover:bg-bg focus-visible:ring-focus disabled:opacity-50 md:h-10 md:gap-2 md:px-4 md:text-[13.5px]"
      >
        <SyncIcon
          className={`size-[13px] text-ink-2 md:size-[14px] ${
            isPending ? "animate-spin" : ""
          }`}
        />
        {isPending ? "Synchro…" : "Synchro Google"}
      </button>
      {error && (
        <p id="sync-error" role="alert" className="max-w-[220px] text-right text-[12px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
