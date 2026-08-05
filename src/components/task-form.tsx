"use client";

import { useRef, useState } from "react";
import { createTask } from "@/lib/actions";
import { CalendarIcon } from "@/components/icons";
import { goalTrio } from "@/lib/goal-colors";

export type GoalOption = { id: string; title: string; color: string };

const CHIP =
  "relative inline-flex h-[30px] items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 text-[12px] font-semibold text-ink-2 focus-within:ring-focus";

/**
 * Ajout de tâche en ligne (§04 · TaskForm inline).
 *
 * Replié : une rangée qu'un clic ouvre, focus dans le champ. Déplié : titre
 * requis, date et objectif optionnels en « chips ». Entrée valide et garde le
 * formulaire ouvert pour enchaîner ; Échap replie.
 */
export function TaskForm({
  goals,
  defaultGoalId,
  defaultDate,
  variant = "row",
  defaultOpen = false,
  collapsedLabel = "Ajouter une tâche",
  autoFocus = false,
}: {
  goals: GoalOption[];
  defaultGoalId?: string;
  defaultDate?: string;
  variant?: "row" | "dashed" | "card";
  defaultOpen?: boolean;
  collapsedLabel?: string;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [goalId, setGoalId] = useState(defaultGoalId ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          // Le champ n'existe qu'après le rendu suivant.
          requestAnimationFrame(() => titleRef.current?.focus());
        }}
        className={
          variant === "dashed"
            ? "flex min-h-[46px] w-full items-center gap-2.5 rounded-md border-[1.5px] border-dashed border-zinc-300 px-3.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-zinc-400 hover:text-ink"
            : "flex min-h-[46px] w-full items-center gap-2.5 px-0.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink"
        }
      >
        <span className="text-[16px] text-ink-3">+</span>
        {collapsedLabel}
      </button>
    );
  }

  const selectedGoal = goals.find((g) => g.id === goalId);
  const trio = selectedGoal ? goalTrio(selectedGoal.color) : null;

  return (
    <form
      action={async (formData) => {
        if (!draft.trim()) return;
        await createTask(formData);
        // On enchaîne : le titre se vide, la date et l'objectif restent.
        setDraft("");
        titleRef.current?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft("");
          setOpen(false);
        }
      }}
      className={
        variant === "card"
          ? "flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5 shadow-xs focus-within:border-accent focus-within:ring-focus md:flex-row md:items-center md:gap-2.5 md:py-2.5 md:pr-2.5 md:pl-4"
          : "flex flex-col gap-3 rounded-[14px] border border-accent bg-surface p-3 ring-focus md:flex-row md:items-center md:gap-2.5"
      }
    >
      <input
        ref={titleRef}
        name="title"
        required
        maxLength={300}
        autoFocus={autoFocus}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ajouter une tâche…"
        aria-label="Titre de la tâche"
        className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
      />

      <div className="flex items-center gap-2">
        <label className={CHIP}>
          <CalendarIcon className="size-3" strokeWidth={2} />
          <span className="tnum">{date ? formatChipDate(date) : "Date"}</span>
          <input
            type="date"
            name="dueDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Échéance"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {defaultGoalId ? (
          <input type="hidden" name="goalId" value={defaultGoalId} />
        ) : (
          goals.length > 0 && (
            <label className={`${CHIP} max-w-[170px]`}>
              <span
                className="size-[7px] shrink-0 rounded-full"
                style={{ backgroundColor: trio ? trio.base : "#d4d4d8" }}
              />
              <span className="truncate">
                {selectedGoal ? selectedGoal.title : "Objectif"}
              </span>
              <span aria-hidden>▾</span>
              <select
                name="goalId"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                aria-label="Objectif"
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">Sans objectif</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
          )
        )}

        <button
          type="submit"
          disabled={!draft.trim()}
          className="ml-auto inline-flex h-8 items-center rounded-md px-3.5 text-[12.5px] font-semibold transition-colors disabled:cursor-default disabled:bg-zinc-200 disabled:text-ink-3 enabled:bg-accent enabled:text-white enabled:hover:bg-accent-hover"
        >
          Ajouter
        </button>
      </div>
    </form>
  );
}

/** « 2026-08-06 » → « 6 août ». */
function formatChipDate(value: string): string {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "Date";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}
