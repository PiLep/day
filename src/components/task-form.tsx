"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createTask } from "@/lib/actions";
import { CalendarIcon } from "@/components/icons";
import { goalTrio } from "@/lib/goal-colors";
import { SubmitButton } from "@/components/submit-button";

export type GoalOption = { id: string; title: string; color: string };

const CHIP =
  "relative inline-flex h-11 items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 text-[12px] font-semibold text-ink-2 focus-within:ring-focus md:h-[30px]";

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
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const wantsNew = useSearchParams().get("new") === "1";
  useEffect(() => {
    if (!wantsNew) return;
    setOpen(true);
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [wantsNew]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => titleRef.current?.focus());
        }}
        className={
          variant === "dashed"
            ? "flex min-h-11 w-full items-center gap-2.5 rounded-md border-[1.5px] border-dashed border-zinc-300 px-3.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-zinc-400 hover:text-ink focus-visible:ring-focus"
            : "flex min-h-11 w-full items-center gap-2.5 px-0.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink focus-visible:ring-focus"
        }
      >
        <span className="text-[16px] text-ink-3" aria-hidden>
          +
        </span>
        {collapsedLabel}
      </button>
    );
  }

  const selectedGoal = goals.find((g) => g.id === goalId);
  const trio = selectedGoal ? goalTrio(selectedGoal.color) : null;

  return (
    <form
      action={async (formData) => {
        const title = String(formData.get("title") ?? "").trim();
        if (!title) {
          setError("Saisissez un titre pour la tâche.");
          titleRef.current?.focus();
          return;
        }
        setError(null);
        await createTask(formData);
        setDraft("");
        titleRef.current?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft("");
          setError(null);
          setOpen(false);
        }
      }}
      noValidate
      className={
        variant === "card"
          ? "flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5 shadow-xs focus-within:border-accent focus-within:ring-focus md:flex-row md:items-center md:gap-2.5 md:py-2.5 md:pr-2.5 md:pl-4"
          : "flex flex-col gap-3 rounded-[14px] border border-accent bg-surface p-3 ring-focus md:flex-row md:items-center md:gap-2.5"
      }
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="task-title" className="sr-only">
          Titre de la tâche
        </label>
        <input
          ref={titleRef}
          id="task-title"
          name="title"
          required
          maxLength={300}
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Ajouter une tâche…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "task-title-error" : undefined}
          className="w-full min-w-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
        />
        {error && (
          <p id="task-title-error" role="alert" className="mt-1 text-[12.5px] font-medium text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
                style={{ backgroundColor: trio ? trio.base : "#a1a1aa" }}
                aria-hidden
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

        <SubmitButton
          label="Ajouter"
          pendingLabel="Ajout…"
          className="ml-auto inline-flex h-11 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 md:h-8 md:px-3.5 md:text-[12.5px]"
        />
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
