import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskInclude, serializeTask } from "@/lib/queries";
import { TaskItem } from "@/components/task-item";
import { TaskForm } from "@/components/task-form";
import { SyncButton } from "@/components/sync-button";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const dateFilter =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(new Date(`${date}T00:00:00.000Z`).getTime() + 86_400_000),
        }
      : undefined;

  const [tasks, goals] = await Promise.all([
    prisma.task.findMany({
      where: { userId, ...(dateFilter ? { dueDate: dateFilter } : {}) },
      include: taskInclude,
      orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.goal.findMany({
      where: { userId, archived: false },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tâches</h1>
          <p className="text-sm text-zinc-500">
            {date
              ? `Tâches du ${new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                }).format(new Date(`${date}T00:00:00.000Z`))}`
              : "Toutes vos tâches, datées ou non."}
          </p>
        </div>
        <SyncButton />
      </header>

      <TaskForm goals={goals} defaultDate={date} />

      <section className="space-y-2">
        {pending.map((t) => (
          <TaskItem key={t.id} task={serializeTask(t)} />
        ))}
        {pending.length === 0 && (
          <p className="rounded-xl bg-white p-4 text-sm text-zinc-400">
            Aucune tâche en attente 🎉
          </p>
        )}
      </section>

      {completed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Terminées ({completed.length})
          </h2>
          <ul className="space-y-2">
            {completed.map((t) => (
              <TaskItem key={t.id} task={serializeTask(t)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
