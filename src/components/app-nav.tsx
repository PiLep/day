"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  ChecklistIcon,
  SignOutIcon,
  SunIcon,
  TargetIcon,
} from "@/components/icons";
import { signOutAction } from "@/lib/auth-actions";

const NAV_ITEMS = [
  { href: "/app", label: "Aujourd'hui", Icon: SunIcon },
  { href: "/app/goals", label: "Objectifs", Icon: TargetIcon },
  { href: "/app/todos", label: "Tâches", Icon: ChecklistIcon },
  { href: "/app/calendar", label: "Calendrier", Icon: CalendarIcon },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

/** Marque « Day » : disque indigo, point blanc au centre. */
export function DayMark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent"
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-full bg-white"
        style={{ width: size / 3.14, height: size / 3.14 }}
      />
    </span>
  );
}

/** Barre latérale desktop — 224 px fixes (§04 · Navigation). */
export function Sidebar({
  user,
}: {
  user: { name: string | null; email: string | null; image: string | null };
}) {
  const isActive = useIsActive();
  const initials = getInitials(user.name, user.email);

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-0.5 border-r border-[#e9e9ec] bg-surface px-3 pt-5 pb-4 md:flex">
      <Link href="/app" className="flex items-center gap-2 px-2.5 pb-[18px]">
        <DayMark />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Day</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-[9px] text-[13.5px] transition-colors ${
                active
                  ? "bg-zinc-100 font-semibold text-ink"
                  : "font-medium text-[#63636b] hover:bg-zinc-100"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3.5 px-0.5">
        <Link
          href="/app/todos?new=1"
          className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover"
        >
          <span className="text-[16px] leading-none font-medium">+</span>
          Nouvelle tâche
        </Link>
      </div>

      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-zinc-100"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={26}
              height={26}
              className="size-[26px] shrink-0 rounded-full"
            />
          ) : (
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-100 text-[10.5px] font-bold text-accent-hover">
              {initials}
            </span>
          )}
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[12.5px] font-semibold text-ink">
              {user.name ?? "Mon compte"}
            </span>
            <span className="truncate text-[11px] text-[#90909a]">
              {user.email ?? "Se déconnecter"}
            </span>
          </span>
          <SignOutIcon className="ml-auto size-4 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          <span className="sr-only">Se déconnecter</span>
        </button>
      </form>
    </aside>
  );
}

/** Barre d'onglets mobile — cibles ≥ 44 px, safe-area iOS. */
export function TabBar() {
  const isActive = useIsActive();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e9e9ec] bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="flex items-stretch px-2 pt-1.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] flex-1 flex-col items-center gap-[3px] pt-2 pb-1.5 ${
                active ? "text-accent" : "text-[#90909a]"
              }`}
            >
              <Icon className="size-[22px]" />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Bouton flottant mobile. Sur « Objectifs » il ouvre la création d'objectif,
 * partout ailleurs une nouvelle tâche — en un tap.
 */
export function Fab() {
  const pathname = usePathname();
  const onGoals = pathname === "/app/goals";
  const href = onGoals ? "/app/goals?new=1" : "/app/todos?new=1";

  return (
    <Link
      href={href}
      aria-label={onGoals ? "Nouvel objectif" : "Nouvelle tâche"}
      className="fixed right-4 bottom-[108px] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-[26px] leading-none text-white shadow-[0_8px_24px_rgb(79_70_229/40%)] transition-colors hover:bg-accent-hover md:hidden"
    >
      <span aria-hidden>+</span>
    </Link>
  );
}

function getInitials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "··";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]!.toUpperCase());
  return letters.join("") || source[0]!.toUpperCase();
}
