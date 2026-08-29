import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  taskInclude,
  habitInclude,
  serializeTask,
  serializeHabit,
  todayRangeUTC,
} from "@/lib/queries";
import { goalDueLabelFull } from "@/lib/dates";
import { weekRangeUTC, habitsWeekProgress } from "@/lib/habits";
import { goalTrio } from "@/lib/goal-colors";
import { percent, ProgressBar } from "@/components/progress-bar";
import { TaskItem } from "@/components/task-item";
import { HabitItem } from "@/components/habit-item";
import { HabitForm } from "@/components/habit-form";
import { TaskForm } from "@/components/task-form";
import { GoalForm } from "@/components/goal-form";
import { ListCard } from "@/components/card";
import { PageShell } from "@/components/page-shell";

/** Nombre de tâches terminées affichées avant « Tout afficher ». */
const DONE_PREVIEW = 3;

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; done?: string }>;
}) {
  const { id } = await params;
  const { edit, done: doneParam } = await searchParams;
  const userId = await requireUserId();
  const { start } = todayRangeUTC();
  const week = weekRangeUTC(start);

  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: {
      tasks: {
        include: taskInclude,
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      },
      habits: {
        include: {
          ...habitInclude,
          logs: {
            where: { occurredOn: { gte: week.start, lt: week.end } },
            select: { occurredOn: true },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!goal) notFound();

  const trio = goalTrio(goal.color);
  const pending = goal.tasks.filter((t) => !t.done);
  const completed = goal.tasks.filter((t) => t.done);
  const habits = goal.habits.map((h) => serializeHabit(h, start));
  const habitProg = habitsWeekProgress(habits);
  const hasHabits = habits.length > 0;

  const pct = hasHabits
    ? percent(habitProg.done, habitProg.total)
    : percent(completed.length, goal.tasks.length);
  const showAllDone = doneParam === "all";
  const shownDone = showAllDone ? completed : completed.slice(0, DONE_PREVIEW);
  const isEditing = edit === "1";
  const goalHref = `/app/goals/${goal.id}`;

  return (
    <PageShell width="narrow">
      <Link
        href="/app/goals"
        className="flex min-h-8 items-center gap-1.5 text-[13.5px] font-semibold text-accent md:text-[13px]"
      >
        <span className="text-[17px] leading-none md:text-[16px]" aria-hidden>
          ‹
        </span>
        Objectifs
      </Link>

      <div className="mt-2 flex items-start gap-2.5 pr-14 md:mt-3.5 md:gap-3 md:pr-0">
        <span
          className="mt-2 size-3 shrink-0 rounded-full md:mt-2.5 md:size-[13px]"
          style={{ backgroundColor: trio.base }}
          aria-hidden
        />
        <h1 className="min-w-0 text-[24px] font-strong tracking-[-0.02em] text-balance md:text-[28px]">
          {goal.title}
        </h1>
        {!isEditing && (
          <Link
            href={`${goalHref}?edit=1`}
            className="ml-auto inline-flex h-11 shrink-0 items-center rounded-[9px] bg-zinc-100 px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-zinc-200 focus-visible:ring-focus md:h-9 md:bg-transparent md:hover:bg-zinc-100"
          >
            Modifier
          </Link>
        )}
      </div>

      {goal.description && (
        <p className="mt-1.5 text-[13px] text-ink-2 md:mt-[7px] md:text-[13.5px]">
          {goal.description}
        </p>
      )}

      {isEditing ? (
        <div className="md:mt-4">
          <GoalForm
            goal={{
              id: goal.id,
              title: goal.title,
              description: goal.description,
              color: goal.color,
              targetDate: goal.targetDate,
            }}
            cancelHref={goalHref}
          />
        </div>
      ) : (
        <>
          <div className="mt-3.5 rounded-lg border border-border bg-surface p-4 shadow-xs md:mt-[18px] md:px-5 md:py-[18px]">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="tnum text-[26px] font-strong tracking-[-0.02em] md:text-[28px]"
                style={{ color: trio.deep }}
              >
                {pct} %
              </span>
              <span className="tnum text-right text-[12px] text-ink-3 md:text-[12.5px]">
                {hasHabits
                  ? `${habitProg.done} / ${habitProg.total} cette semaine`
                  : `${completed.length} / ${goal.tasks.length} tâches`}
                {goal.targetDate && ` · échéance ${goalDueLabelFull(goal.targetDate)}`}
              </span>
            </div>
            <ProgressBar
              done={hasHabits ? habitProg.done : completed.length}
              total={hasHabits ? habitProg.total : goal.tasks.length}
              color={trio.base}
              size="lg"
              className="mt-2.5"
            />
            {hasHabits && (
              <p className="mt-2 text-[12px] text-ink-3">{week.label}</p>
            )}
          </div>

          <p className="mt-5 mb-2 text-[13.5px] font-strong md:mt-[22px] md:text-[14px]">
            Discipline
          </p>
          <p className="mb-2.5 text-[12.5px] leading-[1.45] text-ink-2">
            Cases du jour et quotas de la semaine — pas des tâches one-shot.
          </p>
          {habits.length > 0 ? (
            <ListCard>
              {habits.map((h) => (
                <HabitItem key={h.id} habit={h} showGoal={false} />
              ))}
            </ListCard>
          ) : (
            <ListCard className="px-4 py-5 text-center">
              <p className="text-[14px] font-strong">Pas encore d’habitude</p>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">
                Ex. 10 repas légers, 3 flex, 1 joker, 3 joggings / semaine — et
                une case « pas d’alcool » chaque jour.
              </p>
            </ListCard>
          )}
          <div className="mt-2.5">
            <HabitForm goalId={goal.id} />
          </div>

          <p className="mt-5 mb-2 text-[13.5px] font-strong md:mt-[22px] md:text-[14px]">
            Tâches ponctuelles
          </p>
          <div className="mb-2.5">
            <TaskForm
              goals={[]}
              defaultGoalId={goal.id}
              variant="dashed"
              collapsedLabel="Ajouter une tâche one-shot"
            />
          </div>
          {pending.length > 0 ? (
            <ListCard>
              {pending.map((t) => (
                <TaskItem key={t.id} task={serializeTask(t)} showGoal={false} />
              ))}
            </ListCard>
          ) : (
            <ListCard className="px-4 py-4 text-center">
              <p className="text-[13px] text-ink-2">
                {goal.tasks.length === 0
                  ? "Optionnel — pour un rendez-vous, un achat, un contrôle."
                  : "Plus rien en attente."}
              </p>
            </ListCard>
          )}

          {completed.length > 0 && (
            <>
              <div className="mt-4.5 mb-2 flex items-center justify-between md:mt-5">
                <span className="text-[13.5px] font-strong text-ink-2 md:text-[14px]">
                  Terminées · {completed.length}
                </span>
                {completed.length > DONE_PREVIEW && (
                  <Link
                    href={showAllDone ? goalHref : `${goalHref}?done=all`}
                    className="text-[12px] font-semibold text-accent hover:underline md:text-[12.5px]"
                  >
                    {showAllDone ? "Réduire" : "Tout afficher"}
                  </Link>
                )}
              </div>
              <ListCard muted>
                {shownDone.map((t) => (
                  <TaskItem key={t.id} task={serializeTask(t)} showGoal={false} />
                ))}
              </ListCard>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
