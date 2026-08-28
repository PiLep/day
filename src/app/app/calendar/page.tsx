import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { taskInclude, serializeTask } from "@/lib/queries";
import { dayHeading, monthHeading, toDateString } from "@/lib/dates";
import { goalTrio } from "@/lib/goal-colors";
import { TaskItem } from "@/components/task-item";
import { TaskForm } from "@/components/task-form";
import { ListCard } from "@/components/card";
import { PageShell } from "@/components/page-shell";

const WEEKDAYS_LONG = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const WEEKDAYS_FULL = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

/** La grille fait toujours 6 semaines : la hauteur ne saute pas d'un mois à l'autre. */
const CELLS = 42;

function monthParam(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayAriaLabel(date: Date, taskCount: number, selected: boolean, today: boolean) {
  const weekday = WEEKDAYS_FULL[(date.getUTCDay() + 6) % 7]!;
  const day = date.getUTCDate();
  const month = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    timeZone: "UTC",
  }).format(date);
  const parts = [`${weekday} ${day} ${month}`];
  if (today) parts.push("aujourd'hui");
  if (selected) parts.push("sélectionné");
  if (taskCount === 0) parts.push("aucune tâche");
  else if (taskCount === 1) parts.push("1 tâche");
  else parts.push(`${taskCount} tâches`);
  return parts.join(", ");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string }>;
}) {
  const { m, d } = await searchParams;
  const userId = await requireUserId();

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

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

  const [tasks, goalOptions] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: monthStart, lt: monthEnd },
      },
      include: taskInclude,
      orderBy: [{ done: "asc" }, { createdAt: "asc" }],
    }),
    prisma.goal.findMany({
      where: { userId, archived: false },
      select: { id: true, title: true, color: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byDay = new Map<number, typeof tasks>();
  for (const t of tasks) {
    const day = t.dueDate!.getUTCDate();
    byDay.set(day, [...(byDay.get(day) ?? []), t]);
  }

  // Grille : semaines commençant lundi, jours voisins en gris.
  const leading = (monthStart.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: CELLS }, (_, i) => {
    const date = new Date(Date.UTC(year, month, i - leading + 1));
    const inMonth = date.getUTCMonth() === month;
    return {
      date,
      inMonth,
      isToday: date.getTime() === todayStart.getTime(),
      tasks: inMonth ? (byDay.get(date.getUTCDate()) ?? []) : [],
    };
  });

  const monthContainsToday =
    todayStart >= monthStart && todayStart < monthEnd;
  const selected =
    d && /^\d{4}-\d{2}-\d{2}$/.test(d)
      ? new Date(`${d}T00:00:00.000Z`)
      : monthContainsToday
        ? todayStart
        : monthStart;
  const selectedTasks = byDay.get(selected.getUTCDate()) ?? [];
  const selectedInMonth = selected >= monthStart && selected < monthEnd;

  const navBase = `/app/calendar?m=`;

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-2 pr-14 md:pr-0">
        <h1 className="text-[24px] font-strong tracking-[-0.02em] md:text-[28px]">
          {monthHeading(current)}
        </h1>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Link
            href="/app/calendar"
            className="inline-flex h-11 items-center rounded-md bg-accent-soft px-3 text-[12.5px] font-semibold text-accent-hover transition-colors hover:bg-accent-100 focus-visible:ring-focus md:h-9 md:px-3.5 md:text-[13px]"
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={`${navBase}${monthParam(prev)}`}
            aria-label="Mois précédent"
            className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-[16px] text-ink-2 transition-colors hover:bg-bg focus-visible:ring-focus md:size-9"
          >
            <span aria-hidden>‹</span>
          </Link>
          <Link
            href={`${navBase}${monthParam(next)}`}
            aria-label="Mois suivant"
            className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-[16px] text-ink-2 transition-colors hover:bg-bg focus-visible:ring-focus md:size-9"
          >
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>

      {/* En-têtes de colonnes : initiales sur mobile, abrégés sur desktop. */}
      <div className="mt-3.5 grid grid-cols-7 md:mt-[18px]" aria-hidden>
        {WEEKDAYS_LONG.map((label, i) => (
          <div
            key={label + i}
            className="pb-1.5 text-center text-[11px] font-semibold text-ink-3 md:px-2.5 md:pb-2 md:text-left md:text-[11.5px]"
          >
            <span className="md:hidden">{WEEKDAYS_SHORT[i]}</span>
            <span className="hidden md:inline">{label}</span>
          </div>
        ))}
      </div>

      {/* Mobile : pastilles + marqueur non-couleur (compte). */}
      <div
        className="grid grid-cols-7 rounded-lg border border-border bg-surface px-0.5 py-1.5 shadow-xs md:hidden"
        role="grid"
        aria-label={`Calendrier ${monthHeading(current)}`}
      >
        {cells.map((c) => {
          const isSelected = c.date.getTime() === selected.getTime();
          const count = c.tasks.length;
          return (
            <Link
              key={c.date.toISOString()}
              href={`${navBase}${monthParam(current)}&d=${toDateString(c.date)}`}
              role="gridcell"
              aria-label={dayAriaLabel(c.date, count, isSelected, c.isToday)}
              aria-current={isSelected ? "date" : undefined}
              className="flex h-12 flex-col items-center justify-center gap-0.5 focus-visible:ring-focus"
            >
              <span
                aria-hidden
                className={`tnum flex h-[26px] items-center justify-center rounded-full text-[13px] ${
                  c.isToday
                    ? "size-[26px] bg-accent font-strong text-white"
                    : isSelected
                      ? "size-[26px] bg-zinc-100 font-semibold text-ink"
                      : c.inMonth
                        ? "font-medium text-ink"
                        : "font-medium text-ink-3"
                }`}
              >
                {c.date.getUTCDate()}
              </span>
              <span className="flex h-[7px] items-center gap-[2px]" aria-hidden>
                {count > 0 ? (
                  <>
                    {c.tasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="size-[5px] rounded-full"
                        style={{
                          backgroundColor: t.done
                            ? "#a1a1aa"
                            : goalTrio(t.goal?.color).base,
                        }}
                      />
                    ))}
                    {count > 3 && (
                      <span className="tnum text-[8px] font-semibold leading-none text-ink-2">
                        +{count - 3}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="size-[5px]" />
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Desktop : titres visibles, filets d'1 px obtenus par le fond de la grille. */}
      <div className="hidden overflow-hidden rounded-[14px] border border-border bg-track md:block">
        <div className="grid grid-cols-7 gap-px">
          {cells.map((c) => (
            <div
              key={c.date.toISOString()}
              className={`flex min-h-[88px] flex-col gap-[3px] px-2 py-[7px] ${
                c.inMonth ? "bg-surface" : "bg-bg"
              }`}
            >
              <span
                className={`tnum ${
                  c.isToday
                    ? "flex size-[23px] items-center justify-center rounded-full bg-accent text-[12px] font-strong text-white"
                    : `pt-[3px] pb-0.5 text-[12px] font-semibold ${
                        c.inMonth ? "text-ink" : "text-ink-3"
                      }`
                }`}
              >
                {c.date.getUTCDate()}
              </span>
              {c.tasks.slice(0, 3).map((t) => {
                const trio = goalTrio(t.goal?.color);
                return (
                  <span
                    key={t.id}
                    title={t.title}
                    className={`truncate rounded-[6px] px-[7px] py-0.5 text-[11px] ${
                      t.done ? "line-through" : ""
                    }`}
                    style={{
                      backgroundColor: t.done ? "#f4f4f5" : trio.soft,
                      color: t.done ? "#71717a" : trio.deep,
                    }}
                  >
                    {t.title}
                  </span>
                );
              })}
              {c.tasks.length > 3 && (
                <span className="px-[7px] text-[10px] text-ink-3">
                  +{c.tasks.length - 3} autres
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agenda du jour sélectionné — mobile. */}
      <div className="md:hidden">
        <p className="mt-4.5 mb-2 text-[13.5px] font-strong">
          {dayHeading(selected)}
        </p>
        {selectedInMonth && selectedTasks.length > 0 ? (
          <ListCard>
            {selectedTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={serializeTask(t, todayStart)}
                showDate={false}
              />
            ))}
          </ListCard>
        ) : (
          <ListCard className="px-4 py-5 text-center">
            <p className="text-[14px] font-strong">Rien de prévu</p>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">
              Ajoutez une tâche pour ce jour, synchronisée avec Google Calendar.
            </p>
          </ListCard>
        )}

        <div className="mt-2.5">
          <TaskForm
            key={toDateString(selected)}
            goals={goalOptions}
            defaultDate={toDateString(selected)}
            variant="dashed"
            collapsedLabel="Ajouter une tâche ce jour-là"
          />
        </div>
      </div>
    </PageShell>
  );
}
