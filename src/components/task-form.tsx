"use client";

import { useRef } from "react";
import { createTask } from "@/lib/actions";

export function TaskForm({
  goals,
  defaultGoalId,
  defaultDate,
}: {
  goals: { id: string; title: string }[];
  defaultGoalId?: string;
  defaultDate?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTask(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-2"
    >
      <input
        name="title"
        required
        maxLength={300}
        placeholder="Ajouter une tâche…"
        className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400"
      />
      <input
        type="date"
        name="dueDate"
        defaultValue={defaultDate}
        aria-label="Échéance"
        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600"
      />
      {defaultGoalId ? (
        <input type="hidden" name="goalId" value={defaultGoalId} />
      ) : (
        goals.length > 0 && (
          <select
            name="goalId"
            aria-label="Objectif"
            defaultValue=""
            className="max-w-36 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600"
          >
            <option value="">Sans objectif</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        )
      )}
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        Ajouter
      </button>
    </form>
  );
}
