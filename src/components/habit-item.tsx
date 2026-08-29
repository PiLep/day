"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  toggleHabitToday,
  logHabitOnce,
  unlogHabitOnce,
  deleteHabit,
} from "@/lib/actions";
import { CheckIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DONE_TRIO, goalTrio, NO_GOAL_TRIO } from "@/lib/goal-colors";
import type { HabitItemData } from "@/lib/habits";

/**
 * Ligne d'habitude : case du jour (DAILY) ou compteur n/N de la semaine (WEEKLY).
 */
export function HabitItem({
  habit,
  showGoal = true,
}: {
  habit: HabitItemData;
  showGoal?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [doneToday, setDoneToday] = useOptimistic(habit.doneToday);
  const [weekCount, setWeekCount] = useOptimistic(habit.weekCount);

  const trio = habit.goal ? goalTrio(habit.goal.color) : NO_GOAL_TRIO;
  const met =
    habit.kind === "DAILY" ? doneToday : weekCount >= habit.target;
  const badgeTrio = met ? DONE_TRIO : trio;
  const badge = showGoal && habit.goal ? habit.goal.title : null;

  if (habit.kind === "DAILY") {
    return (
      <div
        className={`group flex min-h-[50px] items-center gap-3 rounded-[6px] border-b border-border-soft px-0.5 py-0.5 transition-colors last:border-b-0 hover:bg-bg ${
          isPending ? "opacity-70" : ""
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={doneToday}
          aria-label={habit.title}
          onClick={() =>
            startTransition(async () => {
              setDoneToday(!doneToday);
              await toggleHabitToday(habit.id);
            })
          }
          style={doneToday ? { backgroundColor: trio.base } : undefined}
          className={`relative flex size-[22px] shrink-0 items-center justify-center rounded-full text-white transition-[background-color,border-color,transform] duration-200 before:absolute before:-inset-[11px] before:content-[''] focus-visible:ring-focus focus-visible:outline-none ${
            doneToday
              ? "border-0"
              : "border-[1.5px] border-zinc-300 bg-surface hover:border-accent"
          }`}
        >
          {doneToday && (
            <span className="motion-safe-daypop flex">
              <CheckIcon />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <span
            title={habit.title}
            className={`block truncate text-[14px] transition-colors duration-200 ${
              doneToday ? "text-ink-3 line-through decoration-zinc-300" : "text-ink"
            }`}
          >
            {habit.title}
          </span>
          <span className="text-[11px] font-medium text-ink-3">Chaque jour</span>
        </div>

        {badge && (
          <span
            title={badge}
            style={{ backgroundColor: badgeTrio.soft, color: badgeTrio.deep }}
            className="max-w-[40%] shrink-0 truncate rounded-[6px] px-2 py-[3px] text-[10.5px] font-semibold"
          >
            {badge}
          </span>
        )}

        <DeleteHabitButton
          title={habit.title}
          confirmOpen={confirmOpen}
          setConfirmOpen={setConfirmOpen}
          isPending={isPending}
          startTransition={startTransition}
          habitId={habit.id}
        />
      </div>
    );
  }

  const atCap = weekCount >= habit.target;

  return (
    <div
      className={`group flex min-h-[50px] items-center gap-3 rounded-[6px] border-b border-border-soft px-0.5 py-0.5 transition-colors last:border-b-0 hover:bg-bg ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <div
        className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          backgroundColor: met ? trio.base : trio.soft,
          color: met ? "#fff" : trio.deep,
        }}
        aria-hidden
      >
        {Math.min(weekCount, habit.target)}
      </div>

      <div className="min-w-0 flex-1">
        <span title={habit.title} className="block truncate text-[14px] text-ink">
          {habit.title}
        </span>
        <span className="tnum text-[11px] font-medium text-ink-3">
          {weekCount} / {habit.target} cette semaine
        </span>
      </div>

      {badge && (
        <span
          title={badge}
          style={{ backgroundColor: badgeTrio.soft, color: badgeTrio.deep }}
          className="hidden max-w-[30%] shrink-0 truncate rounded-[6px] px-2 py-[3px] text-[10.5px] font-semibold sm:inline"
        >
          {badge}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Retirer une occurrence de « ${habit.title} »`}
          disabled={weekCount <= 0 || isPending}
          onClick={() =>
            startTransition(async () => {
              setWeekCount(Math.max(0, weekCount - 1));
              await unlogHabitOnce(habit.id);
            })
          }
          className="flex size-9 items-center justify-center rounded-md text-[18px] font-medium text-ink-2 transition-colors hover:bg-zinc-100 disabled:opacity-30 focus-visible:ring-focus"
        >
          −
        </button>
        <button
          type="button"
          aria-label={`Ajouter une occurrence de « ${habit.title} »`}
          disabled={atCap || isPending}
          onClick={() =>
            startTransition(async () => {
              setWeekCount(weekCount + 1);
              await logHabitOnce(habit.id);
            })
          }
          className="flex size-9 items-center justify-center rounded-md bg-accent-soft text-[18px] font-semibold text-accent transition-colors hover:bg-accent-100 disabled:opacity-30 focus-visible:ring-focus"
        >
          +
        </button>
      </div>

      <DeleteHabitButton
        title={habit.title}
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        isPending={isPending}
        startTransition={startTransition}
        habitId={habit.id}
      />
    </div>
  );
}

function DeleteHabitButton({
  title,
  confirmOpen,
  setConfirmOpen,
  isPending,
  startTransition,
  habitId,
}: {
  title: string;
  confirmOpen: boolean;
  setConfirmOpen: (v: boolean) => void;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  habitId: string;
}) {
  return (
    <>
      <button
        type="button"
        aria-label={`Supprimer « ${title} »`}
        onClick={() => setConfirmOpen(true)}
        className="relative -mr-0.5 flex size-9 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-zinc-100 hover:text-ink md:size-auto md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-3.5"
          aria-hidden
        >
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer l'habitude ?"
        description={`« ${title} » et son historique de la semaine seront supprimés.`}
        confirmLabel="Supprimer"
        pending={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            await deleteHabit(habitId);
            setConfirmOpen(false);
          })
        }
      />
    </>
  );
}
