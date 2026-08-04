import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskInclude, serializeTask, todayRangeUTC } from "@/lib/queries";
import { TaskItem } from "@/components/task-item";
import { TaskForm } from "@/components/task-form";
import { ProgressBar } from "@/components/progress-bar";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { start, end } = todayRangeUTC();

  const [todayTasks, overdueTasks, goals] = await Promise.all([
    prisma.task.findMany({
      where: { userId, dueDate: { gte: start, lt: end } },
      include: taskInclude,
      orderBy: [{ done: "asc" }, { createdAt: "asc" }],
    }),
    prisma.task.findMany({
      where: { userId, done: false, dueDate: { lt: start } },
      include: taskInclude,
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.goal.findMany({
      where: { userId, archived: false },
      include: { tasks: { select: { done: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold capitalize">{today}</h1>
        <p className="text-sm text-zinc-500">
          Bonjour {session!.user.name?.split(" ")[0]} 👋
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Aujourd&apos;hui
        </h2>
        <TaskForm
          goals={goals.map((g) => ({ id: g.id, title: g.title }))}
          defaultDate={start.toISOString().slice(0, 10)}
        />
        {todayTasks.length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-sm text-zinc-400">
            Rien de prévu aujourd&apos;hui. Ajoutez une tâche ci-dessus ✨
          </p>
        ) : (
          <ul className="space-y-2">
            {todayTasks.map((t) => (
              <TaskItem key={t.id} task={serializeTask(t)} />
            ))}
          </ul>
        )}
      </section>

      {overdueTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-500">
            En retard
          </h2>
          <ul className="space-y-2">
            {overdueTasks.map((t) => (
              <TaskItem key={t.id} task={serializeTask(t)} />
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Objectifs
          </h2>
          <Link href="/app/goals" className="text-sm text-indigo-600 hover:underline">
            Tout voir →
          </Link>
        </div>
        {goals.length === 0 ? (
          <Link
            href="/app/goals"
            className="block rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-center text-sm text-zinc-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            Créez votre premier objectif 🎯
          </Link>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {goals.map((g) => {
              const done = g.tasks.filter((t) => t.done).length;
              return (
                <Link
                  key={g.id}
                  href={`/app/goals/${g.id}`}
                  className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="truncate">{g.title}</span>
                  </p>
                  <ProgressBar done={done} total={g.tasks.length} color={g.color} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
