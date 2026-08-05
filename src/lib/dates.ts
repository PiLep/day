/** Parse une valeur de formulaire "YYYY-MM-DD" en Date UTC minuit, sinon null. */
export function parseDateInput(value: unknown): Date | null {
  const s = typeof value === "string" ? value.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formate une Date en "YYYY-MM-DD" (UTC). */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Retourne une nouvelle Date décalée de n jours (UTC). */
export function addDaysUTC(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/** Minuit UTC du jour d'une date. */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Nombre de jours entiers séparant deux dates (UTC), signé. */
export function diffInDaysUTC(from: Date, to: Date): number {
  const ms = startOfDayUTC(to).getTime() - startOfDayUTC(from).getTime();
  return Math.round(ms / 86_400_000);
}

function fr(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...options });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Libellé de date d'une tâche, tel qu'il apparaît sur les maquettes :
 * « aujourd'hui », « hier », « demain », puis « lun. 3 août » dans la semaine,
 * et enfin « 3 août » (ou « 3 août 2027 » si l'année change).
 */
export function taskDateLabel(due: Date, today: Date = new Date()): string {
  const days = diffInDaysUTC(today, due);
  if (days === 0) return "aujourd'hui";
  if (days === -1) return "hier";
  if (days === 1) return "demain";
  if (Math.abs(days) <= 7) {
    return fr({ weekday: "short", day: "numeric", month: "short" }).format(due);
  }
  if (due.getUTCFullYear() === startOfDayUTC(today).getUTCFullYear()) {
    return fr({ day: "numeric", month: "short" }).format(due);
  }
  return fr({ day: "numeric", month: "short", year: "numeric" }).format(due);
}

/** Une tâche non terminée dont la date est passée est « à rattraper ». */
export function isLate(due: Date | null, today: Date = new Date()): boolean {
  return due !== null && diffInDaysUTC(today, due) < 0;
}

/** Échéance d'objectif : « 30 sept. », avec l'année seulement si elle diffère. */
export function goalDueLabel(target: Date, today: Date = new Date()): string {
  const sameYear = target.getUTCFullYear() === startOfDayUTC(today).getUTCFullYear();
  return fr(
    sameYear
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" }
  ).format(target);
}

/** Échéance complète : « 30 sept. 2026 ». */
export function goalDueLabelFull(target: Date): string {
  return fr({ day: "numeric", month: "short", year: "numeric" }).format(target);
}

/** Titre de journée : « Mercredi 5 août ». */
export function dayHeading(d: Date): string {
  return capitalize(
    fr({ weekday: "long", day: "numeric", month: "long" }).format(d)
  );
}

/** Titre de mois : « Août 2026 ». */
export function monthHeading(d: Date): string {
  return capitalize(fr({ month: "long", year: "numeric" }).format(d));
}

/** Durée écoulée en style court : « il y a 2 min », « il y a 3 h ». */
export function timeAgoLabel(from: Date, now: Date = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat("fr-FR", {
    numeric: "auto",
    style: "short",
  });
  const seconds = Math.round((from.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }
  return "à l'instant";
}
