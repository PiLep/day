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
      <div className="flex items-start justify-between gap-3 pr-14 md:pr-0">
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
      <div
        className="mt-3.5 flex rounded-[11px] bg-[#eeeef0] p-[3px] md:mt-5 md:w-80"
        role="tablist"
        aria-label="Filtrer les tâches"
      >
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
          <EmptyLine
            title="Aucune tâche terminée"
            description="Cochez une tâche en attente pour la voir apparaître ici."
            action={{ href: "/app/todos", label: "Voir les tâches en attente" }}
          />
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
            <EmptyLine
              title="Aucune tâche en attente"
              description="Ajoutez une tâche ci-dessus, ou planifiez-en une depuis le calendrier."
              action={{ href: "/app/calendar", label: "Ouvrir le calendrier" }}
            />
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
      role="tab"
      aria-selected={active}
      className={`tnum flex h-11 flex-1 items-center justify-center rounded-[9px] text-[13px] transition-colors focus-visible:ring-focus md:h-8 ${
        active
          ? "bg-surface font-strong text-ink shadow-xs"
          : "font-semibold text-ink-2 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function EmptyLine({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  return (
    <ListCard className="mt-3.5 px-4 py-5 text-center md:mt-4">
      <p className="text-[14px] font-strong">{title}</p>
      <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">{description}</p>
      <Link
        href={action.href}
        className="mt-3.5 inline-flex h-11 items-center rounded-[11px] bg-accent-soft px-4 text-[13.5px] font-semibold text-accent transition-colors hover:bg-accent-100 focus-visible:ring-focus"
      >
        {action.label}
      </Link>
    </ListCard>
  );
}
