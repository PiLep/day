"use client";

import { useOptimistic, useTransition } from "react";
import { toggleTask, deleteTask } from "@/lib/actions";
import { CheckIcon } from "@/components/icons";
import { DONE_TRIO, goalTrio, NO_GOAL_TRIO } from "@/lib/goal-colors";

export type TaskItemData = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  /** « hier », « demain », « lun. 3 août »… calculé côté serveur. */
  dateLabel: string | null;
  /** Tâche datée dans le passé et non terminée : « à rattraper ». */
  late: boolean;
  googleEventId: string | null;
  goal: { id: string; title: string; color: string } | null;
};

/**
 * Une ligne de tâche (§04 · TaskItem).
 *
 * Cocher remplit le cercle de la couleur de l'objectif et fait « pop » la
 * coche ; la ligne ne bouge pas et ne disparaît pas. Le retard se lit en ambre,
 * jamais en rouge.
 */
export function TaskItem({
  task,
  showGoal = true,
  showDate = true,
}: {
  task: TaskItemData;
  showGoal?: boolean;
  showDate?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(task.done);

  const trio = task.goal ? goalTrio(task.goal.color) : NO_GOAL_TRIO;
  const badgeTrio = done ? DONE_TRIO : trio;

  const badge = showGoal && task.goal ? task.goal.title : null;
  // Une tâche terminée n'affiche pas sa date : l'échéance n'a plus d'enjeu (§04).
  const date = showDate && !done ? task.dateLabel : null;

  return (
    <div
      className={`group flex min-h-[50px] items-center gap-3 rounded-[6px] border-b border-border-soft px-0.5 py-0.5 transition-colors last:border-b-0 hover:bg-bg ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={task.title}
        onClick={() =>
          startTransition(async () => {
            setDone(!done);
            await toggleTask(task.id);
          })
        }
        style={done ? { backgroundColor: trio.base } : undefined}
        className={`relative flex size-[22px] shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 before:absolute before:-inset-[11px] before:content-[''] focus-visible:ring-focus focus-visible:outline-none ${
          done
            ? "border-0"
            : "border-[1.5px] border-zinc-300 bg-surface hover:border-accent"
        }`}
      >
        {done && (
          <span className="flex animate-daypop">
            <CheckIcon />
          </span>
        )}
      </button>

      <span
        className={`min-w-0 flex-1 truncate text-[14px] transition-colors duration-200 ${
          done ? "text-ink-3 line-through decoration-zinc-300" : "text-ink"
        }`}
      >
        {task.title}
      </span>

      {badge && (
        <span
          style={{ backgroundColor: badgeTrio.soft, color: badgeTrio.deep }}
          className="ml-auto max-w-[55%] shrink-0 truncate rounded-[6px] px-2 py-[3px] text-[10.5px] font-semibold"
        >
          {badge}
        </span>
      )}

      {date && (
        <span
          className={`tnum shrink-0 text-[11.5px] ${badge ? "" : "ml-auto"} ${
            task.late ? "font-semibold text-late-ink" : "text-ink-3"
          }`}
        >
          {date}
        </span>
      )}

      {/* Suppression : au survol sur desktop, discrète mais atteignable sur mobile. */}
      <button
        type="button"
        aria-label={`Supprimer « ${task.title} »`}
        onClick={() => startTransition(() => deleteTask(task.id))}
        className="-mr-0.5 shrink-0 text-zinc-300 transition hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-3.5"
          aria-hidden
        >
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      </button>
    </div>
  );
}
