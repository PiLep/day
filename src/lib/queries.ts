import type { TaskItemData } from "@/components/task-item";
import { isLate, taskDateLabel } from "@/lib/dates";

export const taskInclude = {
  goal: { select: { id: true, title: true, color: true } },
} as const;

type TaskRow = {
  id: string;
  title: string;
  done: boolean;
  dueDate: Date | null;
  googleEventId: string | null;
  goal: { id: string; title: string; color: string } | null;
};

/**
 * Prépare une tâche pour le client. Le libellé de date (« hier », « demain »,
 * « lun. 3 août ») est calculé côté serveur : le composant reste déterministe
 * et l'hydratation ne dérive pas selon l'horloge du navigateur.
 */
export function serializeTask(t: TaskRow, today: Date = new Date()): TaskItemData {
  return {
    id: t.id,
    title: t.title,
    done: t.done,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    dateLabel: t.dueDate ? taskDateLabel(t.dueDate, today) : null,
    late: !t.done && isLate(t.dueDate, today),
    googleEventId: t.googleEventId,
    goal: t.goal,
  };
}

/** Bornes UTC (date seule) du jour courant. */
export function todayRangeUTC(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
