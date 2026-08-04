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
