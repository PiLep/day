import Link from "next/link";

/**
 * États vides (§04). Une illustration ronde, un titre encourageant, une phrase
 * et une seule action. Jamais de reproche.
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
}: {
  illustration: React.ReactNode;
  title: string;
  description: string;
  action: { href: string; label: string; tone: "primary" | "soft" };
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
      {illustration}
      <p className="mt-5 text-[17px] font-semibold">{title}</p>
      <p className="mt-2 max-w-[270px] text-[13.5px] leading-[1.6] text-ink-2">
        {description}
      </p>
      <Link
        href={action.href}
        className={
          action.tone === "primary"
            ? "mt-5 inline-flex h-[46px] items-center rounded-[11px] bg-accent px-5 text-[14px] font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover"
            : "mt-5 inline-flex h-11 items-center rounded-[11px] bg-accent-soft px-[18px] text-[14px] font-semibold text-accent transition-colors hover:bg-accent-100"
        }
      >
        {action.label}
      </Link>
    </div>
  );
}

/** Journée sans tâche — cercles ambrés très doux. */
export function FreeDayArt() {
  return (
    <div
      className="flex size-[88px] items-center justify-center rounded-full bg-[#fefce8]"
      aria-hidden
    >
      <div className="size-[34px] rounded-full bg-[#fde68a]" />
    </div>
  );
}

/** Aucun objectif — la cible en trois cercles indigo. */
export function FirstGoalArt() {
  return (
    <div
      className="flex size-[88px] items-center justify-center rounded-full bg-accent-soft"
      aria-hidden
    >
      <div className="flex size-[54px] items-center justify-center rounded-full bg-accent-100">
        <div className="size-[18px] rounded-full bg-accent" />
      </div>
    </div>
  );
}
