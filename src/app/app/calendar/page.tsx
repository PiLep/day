import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SyncButton } from "@/components/sync-button";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const session = await auth();

  const now = new Date();
  const current =
    m && /^\d{4}-\d{2}$/.test(m)
      ? new Date(`${m}-01T00:00:00.000Z`)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const prev = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));

  const tasks = await prisma.task.findMany({
    where: {
      userId: session!.user.id,
      dueDate: { gte: monthStart, lt: monthEnd },
    },
    include: { goal: { select: { color: true } } },
    orderBy: { done: "asc" },
  });

  const byDay = new Map<number, typeof tasks>();
  for (const t of tasks) {
    const day = t.dueDate!.getUTCDate();
    byDay.set(day, [...(byDay.get(day) ?? []), t]);
  }

  // Grille : semaine commençant lundi.
  const firstWeekday = (monthStart.getUTCDay() + 6) % 7;
  const daysInMonth = monthEnd.getTime() / 86_400_000 - monthStart.getTime() / 86_400_000;
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurrentMonth =
    now.getUTCFullYear() === year && now.getUTCMonth() === month;
  const todayDate = now.getUTCDate();

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(current);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold capitalize">{monthLabel}</h1>
        <div className="flex items-center gap-2">
          <SyncButton />
          <nav className="flex items-center rounded-lg border border-zinc-200 bg-white">
            <Link
              href={`/app/calendar?m=${monthKey(prev)}`}
              className="px-3 py-1.5 text-zinc-600 hover:text-indigo-600"
              aria-label="Mois précédent"
            >
              ←
            </Link>
            <Link
              href="/app/calendar"
              className="border-x border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-indigo-600"
            >
              Aujourd&apos;hui
            </Link>
            <Link
              href={`/app/calendar?m=${monthKey(next)}`}
              className="px-3 py-1.5 text-zinc-600 hover:text-indigo-600"
              aria-label="Mois suivant"
            >
              →
            </Link>
          </nav>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null)
              return <div key={i} className="min-h-20 border-b border-r border-zinc-100 bg-zinc-50/50 sm:min-h-28" />;

            const dayTasks = byDay.get(day) ?? [];
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = isCurrentMonth && day === todayDate;

            return (
              <Link
                key={i}
                href={`/app/todos?date=${dateStr}`}
                className="min-h-20 border-b border-r border-zinc-100 p-1.5 transition hover:bg-indigo-50/50 sm:min-h-28"
              >
                <span
                  className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? "bg-indigo-600 text-white" : "text-zinc-600"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <p
                      key={t.id}
                      className={`hidden truncate rounded px-1 py-0.5 text-[11px] leading-tight sm:block ${
                        t.done ? "text-zinc-400 line-through" : "text-zinc-700"
                      }`}
                      style={{
                        backgroundColor: `${t.goal?.color ?? "#6366f1"}18`,
                      }}
                    >
                      {t.title}
                    </p>
                  ))}
                  {/* Mobile : pastilles au lieu des titres */}
                  {dayTasks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {dayTasks.slice(0, 4).map((t) => (
                        <span
                          key={t.id}
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor: t.done
                              ? "#d4d4d8"
                              : t.goal?.color ?? "#6366f1",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {dayTasks.length > 3 && (
                    <p className="hidden text-[10px] text-zinc-400 sm:block">
                      +{dayTasks.length - 3} autres
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Les tâches datées sont poussées vers votre Google Calendar (événements
        journée entière). Touchez un jour pour voir ou ajouter des tâches.
      </p>
    </div>
  );
}
