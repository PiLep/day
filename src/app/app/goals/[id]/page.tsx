import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteGoal } from "@/lib/actions";
import { taskInclude, serializeTask } from "@/lib/queries";
import { TaskItem } from "@/components/task-item";
import { TaskForm } from "@/components/task-form";
import { ProgressBar } from "@/components/progress-bar";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const goal = await prisma.goal.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      tasks: {
        include: taskInclude,
        orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!goal) notFound();

  const done = goal.tasks.filter((t) => t.done).length;
  const deleteAction = deleteGoal.bind(null, goal.id);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              {goal.title}
            </h1>
            {goal.description && (
              <p className="mt-1 text-sm text-zinc-600">{goal.description}</p>
            )}
            {goal.targetDate && (
              <p className="mt-1 text-xs text-zinc-500">
                Échéance :{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(goal.targetDate)}
              </p>
            )}
          </div>
          <form action={deleteAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
            >
              Supprimer
            </button>
          </form>
        </div>
        <ProgressBar done={done} total={goal.tasks.length} color={goal.color} />
      </header>

      <section className="space-y-3">
        <TaskForm goals={[]} defaultGoalId={goal.id} />
        <ul className="space-y-2">
          {goal.tasks.map((t) => (
            <TaskItem key={t.id} task={serializeTask(t)} showGoal={false} />
          ))}
        </ul>
        {goal.tasks.length === 0 && (
          <p className="text-center text-sm text-zinc-400">
            Découpez cet objectif en premières tâches concrètes.
          </p>
        )}
      </section>
    </div>
  );
}
