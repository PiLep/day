import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  taskInclude,
  habitInclude,
  serializeTask,
  serializeHabit,
  todayRangeUTC,
} from "@/lib/queries";
import { dayHeading, toDateString } from "@/lib/dates";
import { weekRangeUTC, habitsWeekProgress } from "@/lib/habits";
import { TaskItem } from "@/components/task-item";
import { HabitItem } from "@/components/habit-item";
import { TaskForm } from "@/components/task-form";
import { GoalMiniCard, type GoalCardData } from "@/components/goal-card";
import { ListCard } from "@/components/card";
import { PageShell } from "@/components/page-shell";
import { EmptyState, FreeDayArt } from "@/components/empty-state";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await requireSession();
  const userId = session.user.id;
  const { new: newParam } = await searchParams;
  const openComposer = newParam === "1";
  const { start, end } = todayRangeUTC();
  const week = weekRangeUTC(start);

  const [todayTasks, lateTasks, undatedTasks, habitRows, goalRows] =
    await Promise.all([
      prisma.task.findMany({
        where: { userId, dueDate: { gte: start, lt: end } },
        include: taskInclude,
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.findMany({
        where: { userId, done: false, dueDate: { lt: start } },
        include: taskInclude,
        orderBy: { dueDate: "desc" },
        take: 10,
      }),
      prisma.task.findMany({
        where: { userId, done: false, dueDate: null },
        include: taskInclude,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.habit.findMany({
        where: { userId },
        include: {
          ...habitInclude,
          logs: {
            where: { occurredOn: { gte: week.start, lt: week.end } },
            select: { occurredOn: true },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.goal.findMany({
        where: { userId, archived: false },
        include: {
          tasks: { select: { done: true } },
          habits: {
            include: {
              logs: {
                where: { occurredOn: { gte: week.start, lt: week.end } },
                select: { occurredOn: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const habits = habitRows.map((h) => serializeHabit(h, start));
  const weekProg = habitsWeekProgress(habits);

  const goals: GoalCardData[] = goalRows.map((g) => {
    const taskDone = g.tasks.filter((t) => t.done).length;
    const taskTotal = g.tasks.length;
    const habitProg = habitsWeekProgress(
      g.habits.map((h) => ({ weekCount: h.logs.length, target: h.target }))
    );
    // Progrès affiché : semaine d'habitudes si présentes, sinon tâches one-shot.
    if (habitProg.total > 0) {
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        color: g.color,
        targetDate: g.targetDate,
                done: habitProg.done,
                total: habitProg.total,
                progressLabel: "cette semaine" as const,
              };
            }
            return {
              id: g.id,
              title: g.title,
              description: g.description,
              color: g.color,
              targetDate: g.targetDate,
              done: taskDone,
              total: taskTotal,
              progressLabel: "tâches" as const,
            };
  });
  const goalOptions = goalRows.map((g) => ({
    id: g.id,
    title: g.title,
    color: g.color,
  }));

  const count = todayTasks.length;
  const firstLaunch =
    count === 0 &&
    lateTasks.length === 0 &&
    undatedTasks.length === 0 &&
    habits.length === 0 &&
    goals.length === 0;

  const dailyHabits = habits.filter((h) => h.kind === "DAILY");
  const weeklyHabits = habits.filter((h) => h.kind === "WEEKLY");

  const subtitleParts: string[] = [];
  if (habits.length > 0) {
    subtitleParts.push(
      `semaine ${weekProg.done}/${weekProg.total} sur la discipline`
    );
  }
  if (count > 0) {
    subtitleParts.push(
      count === 1 ? "1 tâche datée" : `${count} tâches datées`
    );
  }

  return (
    <PageShell>
      <p className="pr-14 text-[11px] font-semibold tracking-[0.06em] text-ink-3 uppercase md:pr-0 md:text-[11.5px]">
        {dayHeading(start)}
      </p>
      <h1 className="mt-[3px] pr-14 text-[28px] font-strong tracking-[-0.02em] md:mt-1 md:pr-0 md:text-[30px]">
        Bonjour
      </h1>

      {firstLaunch ? (
        <EmptyState
          illustration={<FreeDayArt />}
          title="Par où commencer ?"
          description="Posez un objectif long terme avec une discipline (jour + semaine), ou une seule tâche pour aujourd’hui."
          action={{
            href: "/app/goals?new=1",
            label: "Créer un objectif",
            tone: "primary",
          }}
        />
      ) : (
        <>
          {subtitleParts.length > 0 && (
            <p className="mt-1.5 text-[13px] text-ink-2 md:text-[13.5px]">
              {subtitleParts.join(" · ")}, à votre rythme.
            </p>
          )}

          <div className="mt-4 grid items-start gap-6 md:mt-[26px] md:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              {habits.length > 0 && (
                <>
                  <div className="mb-2.5 flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-strong md:text-[14.5px]">
                      Discipline
                    </span>
                    <span className="tnum text-[12px] text-ink-3">
                      {week.label}
                    </span>
                  </div>
                  <ListCard>
                    {dailyHabits.map((h) => (
                      <HabitItem key={h.id} habit={h} />
                    ))}
                    {weeklyHabits.map((h) => (
                      <HabitItem key={h.id} habit={h} />
                    ))}
                  </ListCard>
                </>
              )}

              <div
                className={
                  habits.length > 0 ? "mt-6 md:mt-[26px]" : undefined
                }
              >
                {count > 0 ? (
                  <>
                    {habits.length > 0 && (
                      <p className="mb-2.5 text-[14px] font-strong md:text-[14.5px]">
                        Tâches du jour
                      </p>
                    )}
                    <ListCard>
                      {todayTasks.map((t) => (
                        <TaskItem
                          key={t.id}
                          task={serializeTask(t, start)}
                          showDate={false}
                        />
                      ))}
                      <TaskForm
                        goals={goalOptions}
                        defaultDate={toDateString(start)}
                        defaultOpen={openComposer}
                      />
                    </ListCard>
                  </>
                ) : (
                  <ListCard className="px-5 py-6 md:px-6">
                    <p className="text-center text-[14px] font-strong">
                      {habits.length > 0
                        ? "Pas de tâche one-shot"
                        : "Journée libre"}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-[280px] text-center text-[13px] leading-[1.55] text-ink-2">
                      {habits.length > 0
                        ? "La discipline ci-dessus suffit pour aujourd’hui. Ajoutez une tâche seulement si besoin."
                        : "Rien de daté. Ajoutez une tâche, ou ouvrez un objectif pour y accrocher des habitudes."}
                    </p>
                    <div className="mt-4">
                      <TaskForm
                        goals={goalOptions}
                        defaultDate={toDateString(start)}
                        defaultOpen={openComposer || habits.length === 0}
                        variant="dashed"
                        collapsedLabel="Ajouter une tâche pour aujourd’hui"
                      />
                    </div>
                  </ListCard>
                )}
              </div>

              {lateTasks.length > 0 && (
                <>
                  <div className="mt-6 mb-2.5 flex items-center gap-2 md:mt-[26px]">
                    <span className="text-[14px] font-strong md:text-[14.5px]">
                      À rattraper
                    </span>
                    <span className="tnum rounded-full bg-late-soft px-2 py-0.5 text-[11px] font-semibold text-late-ink">
                      {lateTasks.length}
                    </span>
                  </div>
                  <ListCard>
                    {lateTasks.map((t) => (
                      <TaskItem key={t.id} task={serializeTask(t, start)} />
                    ))}
                  </ListCard>
                </>
              )}

              {undatedTasks.length > 0 && (
                <>
                  <div className="mt-6 mb-2.5 flex items-center gap-2 md:mt-[26px]">
                    <span className="text-[14px] font-strong md:text-[14.5px]">
                      Sans date
                    </span>
                  </div>
                  <ListCard>
                    {undatedTasks.map((t) => (
                      <TaskItem key={t.id} task={serializeTask(t, start)} />
                    ))}
                  </ListCard>
                </>
              )}
            </div>

            {goals.length > 0 && (
              <div className="min-w-0">
                <div className="mb-2.5 flex items-baseline justify-between">
                  <span className="text-[14px] font-strong md:text-[13.5px]">
                    <span className="md:hidden">Objectifs</span>
                    <span className="hidden md:inline">Objectifs récents</span>
                  </span>
                  <Link
                    href="/app/goals"
                    className="text-[12.5px] font-semibold text-accent hover:underline md:text-[12px]"
                  >
                    Tout voir
                  </Link>
                </div>

                <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:hidden">
                  {goals.map((g) => (
                    <GoalMiniCard key={g.id} goal={g} layout="carousel" />
                  ))}
                </div>
                <div className="hidden flex-col gap-2.5 md:flex">
                  {goals.map((g) => (
                    <GoalMiniCard key={g.id} goal={g} layout="stacked" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {firstLaunch && openComposer && (
        <div className="mt-6">
          <ListCard>
            <TaskForm
              goals={goalOptions}
              defaultDate={toDateString(start)}
              defaultOpen
            />
          </ListCard>
        </div>
      )}
    </PageShell>
  );
}
