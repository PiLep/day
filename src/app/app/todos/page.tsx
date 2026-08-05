import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { taskInclude, serializeTask } from "@/lib/queries";
import { timeAgoLabel } from "@/lib/dates";
import { TaskItem } from "@/components/task-item";
import { TaskForm } from "@/components/task-form";
import { SyncButton } from "@/components/sync-button";
import { ListCard } from "@/components/card";
import { PageShell } from "@/components/page-shell";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; new?: string }>;
}) {
  const { tab, new: isNew } = await searchParams;
  const userId = await requireUserId();

  const [tasks, goals, user] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.goal.findMany({
      where: { userId, archived: false },
      select: { id: true, title: true, color: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lastSyncedAt: true },
    }),
  ]);

  const today = new Date();
  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);
  const showDone = tab === "done";

  return (
    <PageShell width="medium">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-strong tracking-[-0.02em] md:text-[30px]">
            Tâches
          </h1>
          <p className="mt-1.5 text-[11px] text-ink-3 md:text-[12.5px]">
            {user?.lastSyncedAt
              ? `Synchronisé ${timeAgoLabel(user.lastSyncedAt, today)} · événements journée entière`
              : "Synchronisation Google Calendar · événements journée entière"}
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Filtre segmenté (§04). */}
      <div className="mt-3.5 flex rounded-[11px] bg-[#eeeef0] p-[3px] md:mt-5 md:w-80">
        <Segment
          href="/app/todos"
          active={!showDone}
          label={`En attente · ${pending.length}`}
        />
        <Segment
          href="/app/todos?tab=done"
          active={showDone}
          label={`Terminées · ${completed.length}`}
        />
      </div>

      {!showDone && (
        <div className="mt-3.5 md:mt-4">
          <TaskForm
            goals={goals}
            variant="card"
            defaultOpen
            autoFocus={isNew === "1"}
          />
        </div>
      )}

      {showDone ? (
        completed.length > 0 ? (
          <ListCard muted className="mt-3.5 md:mt-4">
            {completed.map((t) => (
              <TaskItem key={t.id} task={serializeTask(t, today)} />
            ))}
          </ListCard>
        ) : (
          <EmptyLine>Aucune tâche terminée pour l&apos;instant.</EmptyLine>
        )
      ) : (
        <>
          {pending.length > 0 ? (
            <ListCard className="mt-3.5 md:mt-4">
              {pending.map((t) => (
                <TaskItem key={t.id} task={serializeTask(t, today)} />
              ))}
            </ListCard>
          ) : (
            <EmptyLine>
              Aucune tâche en attente. Tout est à jour.
            </EmptyLine>
          )}

          {completed.length > 0 && (
            <>
              <p className="mt-5 mb-2 text-[13.5px] font-strong text-ink-2">
                Terminées · {completed.length}
              </p>
              <ListCard muted>
                {completed.map((t) => (
                  <TaskItem key={t.id} task={serializeTask(t, today)} />
                ))}
              </ListCard>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}

function Segment({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`tnum flex h-[34px] flex-1 items-center justify-center rounded-[9px] text-[13px] transition-colors md:h-8 ${
        active
          ? "bg-surface font-strong text-ink shadow-xs"
          : "font-semibold text-ink-2 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <ListCard className="mt-3.5 px-4 py-5 text-center md:mt-4">
      <p className="text-[13px] text-ink-2">{children}</p>
    </ListCard>
  );
}
