"use client";

import { useTransition } from "react";
import { syncAllTasks } from "@/lib/actions";
import { SyncIcon } from "@/components/icons";

/** Bouton secondaire (§04) — h36 mobile / h40 desktop, bordure toujours visible. */
export function SyncButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => syncAllTasks())}
      disabled={isPending}
      title="Pousser les tâches datées vers Google Calendar"
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12.5px] font-semibold text-ink shadow-xs transition-colors hover:border-zinc-300 hover:bg-bg disabled:opacity-50 md:h-10 md:gap-2 md:px-4 md:text-[13.5px]"
    >
      <SyncIcon
        className={`size-[13px] text-ink-2 md:size-[14px] ${
          isPending ? "animate-spin" : ""
        }`}
      />
      {isPending ? "Synchro…" : "Synchro Google"}
    </button>
  );
}
