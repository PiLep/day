"use client";

import { useRef, useState } from "react";
import { createGoal } from "@/lib/actions";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function GoalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-zinc-300 bg-white p-3 text-sm font-medium text-zinc-500 transition hover:border-indigo-400 hover:text-indigo-600"
      >
        + Nouvel objectif
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createGoal(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <input
        name="title"
        required
        maxLength={200}
        autoFocus
        placeholder="Titre de l'objectif (ex. Courir un semi-marathon)"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
      <textarea
        name="description"
        maxLength={2000}
        rows={2}
        placeholder="Description (optionnel)"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          Échéance
          <input
            type="date"
            name="targetDate"
            className="rounded-lg border border-zinc-200 px-2 py-1.5"
          />
        </label>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Couleur">
          {COLORS.map((c, i) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <span
                className="block size-6 rounded-full border-2 border-transparent transition peer-checked:border-zinc-900"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Créer
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
