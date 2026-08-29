import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GoalForm } from "@/components/goal-form";
import { GoalCard, type GoalCardData } from "@/components/goal-card";
import { PageShell } from "@/components/page-shell";
import { EmptyState, FirstGoalArt } from "@/components/empty-state";
import { weekRangeUTC, habitsWeekProgress } from "@/lib/habits";
import { todayRangeUTC } from "@/lib/queries";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: creating } = await searchParams;
  const userId = await requireUserId();
  const { start } = todayRangeUTC();
  const week = weekRangeUTC(start);

  const rows = await prisma.goal.findMany({
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
  });

  const goals: GoalCardData[] = rows.map((g) => {
    const habitProg = habitsWeekProgress(
      g.habits.map((h) => ({ weekCount: h.logs.length, target: h.target }))
    );
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
      done: g.tasks.filter((t) => t.done).length,
      total: g.tasks.length,
      progressLabel: "tâches" as const,
    };
  });

  const reached = goals.filter((g) => g.total > 0 && g.done === g.total).length;
  const ongoing = goals.length - reached;
  const isCreating = creating === "1";
  const today = new Date();

  return (
    <PageShell>
      <div className="flex items-baseline justify-between pr-14 md:items-center md:pr-0">
        <div>
          <h1 className="text-[28px] font-strong tracking-[-0.02em] md:text-[30px]">
            Objectifs
          </h1>
          <p className="mt-1.5 hidden text-[13px] text-ink-2 md:block">
            {ongoing} en cours{reached > 0 && ` · ${reached} atteint${reached > 1 ? "s" : ""}`}
          </p>
        </div>
        <span className="tnum text-[12.5px] text-ink-3 md:hidden">
          {ongoing} en cours
        </span>
        <Link
          href="/app/goals?new=1"
          className="hidden h-10 items-center rounded-md bg-accent px-[18px] text-[14px] font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover md:inline-flex"
        >
          + Nouvel objectif
        </Link>
      </div>

      {isCreating && (
        <div className="md:mt-[22px]">
          <GoalForm cancelHref="/app/goals"/>
        </div>
      )}

      {goals.length === 0 && !isCreating ? (
        <EmptyState
          illustration={<FirstGoalArt />}
          title="Un objectif à la fois"
          description="Pour un objectif long terme, Day pose une discipline (jour + quotas de la semaine). Les tâches one-shot restent optionnelles."
          action={{
            href: "/app/goals?new=1",
            label: "Créer mon premier objectif",
            tone: "primary",
          }}
        />
      ) : (
        <div className="mt-4 grid gap-3 md:mt-[22px] md:grid-cols-3 md:gap-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} today={today} />
          ))}
          <Link
            href="/app/goals?new=1"
            className="hidden min-h-[150px] flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-zinc-300 text-ink-2 transition-colors hover:border-zinc-400 hover:text-ink md:flex"
          >
            <span className="text-[22px] text-ink-3">+</span>
            <span className="text-[13px] font-semibold">Nouvel objectif</span>
          </Link>
        </div>
      )}
    </PageShell>
  );
}
