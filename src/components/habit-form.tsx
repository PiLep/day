"use client";

import { useState } from "react";
import { createHabit } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

/**
 * Ajout d'une habitude : discipline du jour ou quota de la semaine.
 */
export function HabitForm({
  goalId,
  defaultOpen = false,
}: {
  goalId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [kind, setKind] = useState<"DAILY" | "WEEKLY">("WEEKLY");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-md border-[1.5px] border-dashed border-zinc-300 px-3.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-zinc-400 hover:text-ink focus-visible:ring-focus"
      >
        <span className="text-[16px] text-ink-3" aria-hidden>
          +
        </span>
        Ajouter une habitude (jour ou semaine)
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await createHabit(fd);
        setOpen(false);
      }}
      className="rounded-lg border border-border bg-surface p-3.5 shadow-xs"
    >
      <input type="hidden" name="goalId" value={goalId} />
      <label className="block text-[12px] font-semibold text-ink-2" htmlFor="habit-title">
        Intitulé
      </label>
      <input
        id="habit-title"
        name="title"
        required
        maxLength={200}
        placeholder="Ex. Repas léger, Jogging, Pas d'alcool…"
        className="mt-1.5 h-11 w-full rounded-md border border-border bg-bg px-3.5 text-[14px] outline-none focus:border-accent focus:ring-focus"
        autoFocus
      />

      <fieldset className="mt-3">
        <legend className="text-[12px] font-semibold text-ink-2">Rythme</legend>
        <div className="mt-1.5 flex gap-2">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              kind === "DAILY"
                ? "border-accent bg-accent-soft text-accent-hover"
                : "border-border text-ink-2 hover:bg-zinc-50"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value="DAILY"
              className="sr-only"
              checked={kind === "DAILY"}
              onChange={() => setKind("DAILY")}
            />
            Chaque jour
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              kind === "WEEKLY"
                ? "border-accent bg-accent-soft text-accent-hover"
                : "border-border text-ink-2 hover:bg-zinc-50"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value="WEEKLY"
              className="sr-only"
              checked={kind === "WEEKLY"}
              onChange={() => setKind("WEEKLY")}
            />
            Par semaine
          </label>
        </div>
      </fieldset>

      {kind === "WEEKLY" && (
        <div className="mt-3">
          <label
            className="block text-[12px] font-semibold text-ink-2"
            htmlFor="habit-target"
          >
            Objectif / semaine
          </label>
          <input
            id="habit-target"
            name="target"
            type="number"
            min={1}
            max={21}
            defaultValue={3}
            className="mt-1.5 h-11 w-24 rounded-md border border-border bg-bg px-3.5 text-[14px] outline-none focus:border-accent focus:ring-focus"
          />
        </div>
      )}
      {kind === "DAILY" && <input type="hidden" name="target" value="1" />}

      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 flex-1 rounded-md px-3 text-[13.5px] font-semibold text-ink-2 hover:bg-zinc-100 focus-visible:ring-focus"
        >
          Annuler
        </button>
        <SubmitButton
          label="Ajouter"
          pendingLabel="…"
          className="h-11 flex-1 rounded-md bg-accent px-3 text-[13.5px] font-semibold text-white hover:bg-accent-hover"
        />
      </div>
    </form>
  );
}
