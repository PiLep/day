import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { taskInclude, serializeTask, todayRangeUTC } from "@/lib/queries";
import { dayHeading, toDateString } from "@/lib/dates";
import { TaskItem } from "@/components/task-item";
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

  const [todayTasks, lateTasks, undatedTasks, goalRows] = await Promise.all([
    prisma.task.findMany({
      where: { userId, dueDate: { gte: start, lt: end } },
      include: taskInclude,
      // Ordre stable : cocher une tâche ne la fait pas sauter de place (§05).
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: { userId, done: false, dueDate: { lt: start } },
      include: taskInclude,
      // Le retard le plus frais d'abord : « hier » avant « lun. 3 août ».
      orderBy: { dueDate: "desc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: { userId, done: false, dueDate: null },
      include: taskInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.goal.findMany({
      where: { userId, archived: false },
      include: { tasks: { select: { done: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const goals: GoalCardData[] = goalRows.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    color: g.color,
    targetDate: g.targetDate,
    done: g.tasks.filter((t) => t.done).length,
    total: g.tasks.length,
  }));
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
    goals.length === 0;

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
          description="Posez un objectif, ou ajoutez une seule tâche pour aujourd’hui. Le coach peut aussi vous aider à découper."
          action={{
            href: "/app/goals?new=1",
            label: "Créer un objectif",
            tone: "primary",
          }}
        />
      ) : (
        <>
          {count > 0 && (
            <p className="mt-1.5 text-[13px] text-ink-2 md:text-[13.5px]">
              {count === 1
                ? "1 tâche pour avancer aujourd'hui, à votre rythme."
                : `${count} tâches pour avancer aujourd'hui, à votre rythme.`}
            </p>
          )}

          <div className="mt-4 grid items-start gap-6 md:mt-[26px] md:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              {count > 0 ? (
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
              ) : (
                <ListCard className="px-5 py-6 md:px-6">
                  <p className="text-center text-[14px] font-strong">
                    Journée libre
                  </p>
                  <p className="mx-auto mt-1.5 max-w-[280px] text-center text-[13px] leading-[1.55] text-ink-2">
                    Rien de daté aujourd&apos;hui. Ajoutez une tâche, ou demandez
                    au coach un focus réaliste.
                  </p>
                  <div className="mt-4">
                    <TaskForm
                      goals={goalOptions}
                      defaultDate={toDateString(start)}
                      defaultOpen
                      variant="dashed"
                      collapsedLabel="Ajouter une tâche pour aujourd’hui"
                    />
                  </div>
                  {undatedTasks.length > 0 && (
                    <p className="mt-3 text-center text-[12px] text-ink-3">
                      Ou piochez plus bas dans les tâches sans date.
                    </p>
                  )}
                </ListCard>
              )}

              {lateTasks.length > 0 && (
                <>
                  <div className="mt-6 mb-2.5 flex items-center gap-2 md:mt-[26px]">
                    <span className="text-[14px] font-strong md:text-[14.5px]">
                      À rattraper
                    </span>
                    <span className="tnum rounded-full bg-late-soft px-2 py-0.5 text-[11px] font-semibold text-late-ink">
                      {lateTasks.length}
                    </span>
                    <span className="text-[12px] text-ink-3 md:text-[12.5px]">
                      le coach peut proposer un report
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
                    <span className="tnum text-[12px] text-ink-3 md:text-[12.5px]">
                      à dater quand vous voulez
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
              // min-w-0 : sans lui le carrousel impose sa largeur intrinsèque
              // à la colonne de la grille et fait déborder la page.
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

                {/* Carrousel sur mobile, colonne sur desktop. */}
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
