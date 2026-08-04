"use client";

import { useTransition } from "react";
import { syncAllTasks } from "@/lib/actions";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => syncAllTasks())}
      disabled={isPending}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
      title="Pousser les tâches datées vers Google Calendar"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={`size-4 ${isPending ? "animate-spin" : ""}`}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 12a8 8 0 0 1 13.6-5.7L20 8m0-4v4h-4m4 4a8 8 0 0 1-13.6 5.7L4 16m0 4v-4h4"
        />
      </svg>
      {isPending ? "Synchro…" : "Synchro Google"}
    </button>
  );
}
