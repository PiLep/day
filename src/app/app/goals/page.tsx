import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoalForm } from "@/components/goal-form";
import { ProgressBar } from "@/components/progress-bar";

export default async function GoalsPage() {
  const session = await auth();
  const goals = await prisma.goal.findMany({
    where: { userId: session!.user.id, archived: false },
    include: { tasks: { select: { done: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Objectifs</h1>
        <p className="text-sm text-zinc-500">
          Un objectif = une direction. Découpez-le en tâches concrètes.
        </p>
      </header>

      <GoalForm />

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((g) => {
          const done = g.tasks.filter((t) => t.done).length;
          return (
            <Link
              key={g.id}
              href={`/app/goals/${g.id}`}
              className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300"
            >
              <div>
                <p className="flex items-center gap-2 font-medium">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="truncate">{g.title}</span>
                </p>
                {g.targetDate && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Échéance :{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(g.targetDate)}
                  </p>
                )}
              </div>
              <ProgressBar done={done} total={g.tasks.length} color={g.color} />
            </Link>
          );
        })}
      </div>

      {goals.length === 0 && (
        <p className="text-center text-sm text-zinc-400">
          Aucun objectif pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
