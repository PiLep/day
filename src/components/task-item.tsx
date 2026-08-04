"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toggleTask, deleteTask } from "@/lib/actions";

export type TaskItemData = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  googleEventId: string | null;
  goal: { id: string; title: string; color: string } | null;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function TaskItem({
  task,
  showGoal = true,
}: {
  task: TaskItemData;
  showGoal?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        aria-label={task.done ? "Marquer à faire" : "Marquer terminée"}
        onClick={() => startTransition(() => toggleTask(task.id))}
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.done
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-zinc-300 hover:border-indigo-500"
        }`}
      >
        {task.done && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.done ? "text-zinc-400 line-through" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              📅 {formatDate(task.dueDate)}
              {task.googleEventId && (
                <span title="Synchronisée avec Google Calendar">·↻</span>
              )}
            </span>
          )}
          {showGoal && task.goal && (
            <Link
              href={`/app/goals/${task.goal.id}`}
              className="flex items-center gap-1 truncate hover:underline"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: task.goal.color }}
              />
              {task.goal.title}
            </Link>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label="Supprimer"
        onClick={() => startTransition(() => deleteTask(task.id))}
        className="text-zinc-300 transition hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-7 0 1 13h6l1-13" />
        </svg>
      </button>
    </li>
  );
}
