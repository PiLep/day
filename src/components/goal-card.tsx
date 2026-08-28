import Link from "next/link";
import { ProgressBar, percent } from "@/components/progress-bar";
import { goalTrio } from "@/lib/goal-colors";
import { goalDueLabel } from "@/lib/dates";

export type GoalCardData = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  targetDate: Date | null;
  done: number;
  total: number;
};

/**
 * Carte d'objectif (§04 · GoalCard). Toute la carte est cliquable.
 * Repos : ombre xs. Survol : bordure 300 + ombre md + translateY(-1px).
 */
export function GoalCard({
  goal,
  today,
  className = "",
}: {
  goal: GoalCardData;
  today: Date;
  className?: string;
}) {
  const trio = goalTrio(goal.color);
  const pct = percent(goal.done, goal.total);

  return (
    <Link
      href={`/app/goals/${goal.id}`}
      className={`block rounded-lg border border-border bg-surface p-4 shadow-xs transition duration-150 hover:-translate-y-px hover:border-zinc-300 hover:shadow-md md:p-[18px] ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: trio.base }}
        />
        <span
          title={goal.title}
          className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
        >
          {goal.title}
        </span>
        {goal.targetDate && (
          <span className="tnum ml-auto shrink-0 text-[11.5px] text-ink-3">
            {goalDueLabel(goal.targetDate, today)}
          </span>
        )}
      </div>

      {/* Hauteur réservée sur desktop pour que la grille reste alignée. */}
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.5] text-ink-2 md:min-h-[38px]">
        {goal.description}
      </p>

      <ProgressBar
        done={goal.done}
        total={goal.total}
        color={trio.base}
        className="mt-3"
      />

      <div className="mt-1.5 flex justify-between">
        <span className="tnum text-[11.5px] text-ink-3">
          {goal.done} / {goal.total} tâches
        </span>
        <span
          className="tnum text-[12px] font-semibold"
          style={{ color: trio.deep }}
        >
          {pct} %
        </span>
      </div>
    </Link>
  );
}

/**
 * Variante compacte utilisée sur « Aujourd'hui » : carrousel horizontal sur
 * mobile, colonne de droite sur desktop.
 */
export function GoalMiniCard({
  goal,
  layout,
}: {
  goal: GoalCardData;
  layout: "carousel" | "stacked";
}) {
  const trio = goalTrio(goal.color);
  const pct = percent(goal.done, goal.total);

  if (layout === "stacked") {
    return (
      <Link
        href={`/app/goals/${goal.id}`}
        className="block rounded-[14px] border border-border bg-surface px-4 py-3.5 shadow-xs transition-colors hover:border-zinc-300"
      >
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: trio.base }}
          />
          <span title={goal.title} className="truncate text-[13px] font-semibold">
            {goal.title}
          </span>
          <span
            className="tnum ml-auto shrink-0 text-[12px] font-semibold"
            style={{ color: trio.deep }}
          >
            {pct} %
          </span>
        </div>
        <ProgressBar
          done={goal.done}
          total={goal.total}
          color={trio.base}
          size="sm"
          className="mt-2.5"
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/app/goals/${goal.id}`}
      className="block w-[172px] shrink-0 rounded-[14px] border border-border bg-surface p-3.5 shadow-xs"
    >
      <div className="flex items-center gap-[7px]">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: trio.base }}
        />
        <span title={goal.title} className="truncate text-[12.5px] font-semibold">
          {goal.title}
        </span>
      </div>
      <ProgressBar
        done={goal.done}
        total={goal.total}
        color={trio.base}
        size="sm"
        className="mt-2.5"
      />
      <div className="mt-[7px] flex justify-between gap-1">
        <span className="tnum truncate text-[11px] text-ink-3">
          {goal.done} / {goal.total} tâches
        </span>
        <span
          className="tnum text-[11px] font-semibold"
          style={{ color: trio.deep }}
        >
          {pct} %
        </span>
      </div>
    </Link>
  );
}
