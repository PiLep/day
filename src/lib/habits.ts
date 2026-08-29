import { addDaysUTC, startOfDayUTC, toDateString } from "@/lib/dates";

export type HabitKind = "DAILY" | "WEEKLY";

export type HabitItemData = {
  id: string;
  title: string;
  kind: HabitKind;
  target: number;
  /** Occurrences cette semaine (lundi → dimanche UTC). */
  weekCount: number;
  /** Pour DAILY : déjà fait aujourd'hui. */
  doneToday: boolean;
  goal: { id: string; title: string; color: string } | null;
};

/** Lundi 00:00 UTC de la semaine contenant `day` (ISO / Europe). */
export function startOfWeekUTC(day: Date = new Date()): Date {
  const start = startOfDayUTC(day);
  // getUTCDay: 0 = dimanche … 1 = lundi
  const dow = start.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDaysUTC(start, offset);
}

/** Dimanche suivant exclusif (lundi prochain). */
export function endOfWeekUTC(day: Date = new Date()): Date {
  return addDaysUTC(startOfWeekUTC(day), 7);
}

export function weekRangeUTC(day: Date = new Date()): {
  start: Date;
  end: Date;
  label: string;
} {
  const start = startOfWeekUTC(day);
  const end = endOfWeekUTC(day);
  const endInclusive = addDaysUTC(end, -1);
  return {
    start,
    end,
    label: `Sem. ${toDateString(start).slice(5)} → ${toDateString(endInclusive).slice(5)}`,
  };
}

/** Score de la semaine pour une habitude (plafonné à la cible). */
export function habitWeekScore(weekCount: number, target: number): {
  done: number;
  total: number;
  met: boolean;
} {
  const total = Math.max(1, target);
  const done = Math.min(weekCount, total);
  return { done, total, met: weekCount >= total };
}

/** Agrège le progrès semaine de plusieurs habitudes. */
export function habitsWeekProgress(
  habits: { weekCount: number; target: number }[]
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const h of habits) {
    const s = habitWeekScore(h.weekCount, h.target);
    done += s.done;
    total += s.total;
  }
  return { done, total };
}

export type HabitBlueprint = {
  title: string;
  kind: HabitKind;
  target: number;
};

/**
 * Plan discipline pour objectifs long terme (poids, forme, alimentation).
 * Quotas hebdo + 1–2 cases du jour — pas de tâches one-shot datées.
 */
export function decomposeDiscipline(raw: string): {
  title: string;
  habits: HabitBlueprint[];
} {
  const cleaned = raw
    .replace(/^(je\s+veux|j.?aimerais|objectif\s*:?|cr[eé]er\s+)/i, "")
    .trim();
  const title =
    cleaned.length > 0
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : "Nouvel objectif";
  const lower = title.toLowerCase();

  if (/80\s*kg|poids|maigr|mincir|kilos?|alimentation|r[eé]gime/.test(lower)) {
    return {
      title: title.slice(0, 200),
      habits: [
        { title: "Repas léger", kind: "WEEKLY", target: 10 },
        { title: "Repas flex", kind: "WEEKLY", target: 3 },
        { title: "Joker", kind: "WEEKLY", target: 1 },
        { title: "Pas d'alcool", kind: "DAILY", target: 1 },
        { title: "Jogging", kind: "WEEKLY", target: 3 },
      ],
    };
  }

  if (/sport|courir|course|muscu|salle|yoga|forme/.test(lower)) {
    return {
      title: title.slice(0, 200),
      habits: [
        { title: "Séance (20–40 min)", kind: "WEEKLY", target: 3 },
        { title: "Marche ou mobilité", kind: "WEEKLY", target: 2 },
        { title: "Bonne nuit (≥ 7 h)", kind: "DAILY", target: 1 },
      ],
    };
  }

  return {
    title: title.slice(0, 200),
    habits: [
      { title: "Petit pas du jour", kind: "DAILY", target: 1 },
      { title: "Session dédiée", kind: "WEEKLY", target: 3 },
    ],
  };
}

export function isDisciplineIntent(text: string): boolean {
  return /80\s*kg|poids|maigr|mincir|kilos?|alimentation|r[eé]gime|sport|courir|forme|discipline|habitude|hebdo|semaine/.test(
    text
  );
}
