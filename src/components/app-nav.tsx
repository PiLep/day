"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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
      aria-hidden
    >
      <span
        className="rounded-full bg-white"
        style={{ width: size / 3.14, height: size / 3.14 }}
      />
    </span>
  );
}

type UserInfo = {
  name: string | null;
  email: string | null;
  image: string | null;
};

/** Barre latérale desktop — 224 px fixes (§04 · Navigation). */
export function Sidebar({ user }: { user: UserInfo }) {
  const isActive = useIsActive();
  const initials = getInitials(user.name, user.email);

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-0.5 border-r border-border bg-surface px-3 pt-5 pb-4 md:flex">
      <Link href="/app" className="flex items-center gap-2 px-2.5 pb-[18px]">
        <DayMark />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Day</span>
      </Link>

      <nav className="flex flex-col gap-0.5" aria-label="Principal">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-[9px] text-[13.5px] transition-colors focus-visible:ring-focus ${
                active
                  ? "bg-zinc-100 font-semibold text-ink"
                  : "font-medium text-ink-2 hover:bg-zinc-100"
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
          className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover focus-visible:ring-focus"
        >
          <span className="text-[16px] leading-none font-medium">+</span>
          Nouvelle tâche
        </Link>
      </div>

      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-zinc-100 focus-visible:ring-focus"
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
            <span className="truncate text-[11px] text-ink-3">
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

/** Compte mobile — accessible depuis chaque écran (menu ancré en haut à droite). */
export function MobileAccountMenu({ user }: { user: UserInfo }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const initials = getInitials(user.name, user.email);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-30 md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? titleId : undefined}
        aria-label="Compte"
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs focus-visible:ring-focus"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-full"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-accent-100 text-[11px] font-bold text-accent-hover">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="absolute top-[calc(100%+0.5rem)] right-0 w-[min(calc(100vw-1.5rem),260px)] rounded-lg border border-border bg-surface p-3 shadow-md"
        >
          <p id={titleId} className="truncate text-[13px] font-semibold text-ink">
            {user.name ?? "Mon compte"}
          </p>
          {user.email && (
            <p className="mt-0.5 truncate text-[12px] text-ink-2">{user.email}</p>
          )}
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-100 text-[13.5px] font-semibold text-ink transition-colors hover:bg-zinc-200 focus-visible:ring-focus"
            >
              <SignOutIcon className="size-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Barre d'onglets mobile — cibles ≥ 44 px, safe-area iOS. */
export function TabBar() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="flex items-stretch px-1 pt-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 focus-visible:ring-focus ${
                active ? "text-accent" : "text-ink-2"
              }`}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.8} />
              <span className="text-[11px] font-semibold leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Bouton flottant mobile. Sur « Objectifs » il ouvre la création d'objectif ;
 * sur le calendrier et le détail d'un objectif il ouvre le formulaire de tâche
 * en place ; partout ailleurs une nouvelle tâche — en un tap.
 */
export function Fab() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onGoals = pathname === "/app/goals";

  const staysHere =
    onGoals || pathname.startsWith("/app/goals/") || pathname === "/app/calendar";
  const params = new URLSearchParams(searchParams);
  params.set("new", "1");
  const href = staysHere ? `${pathname}?${params}` : "/app/todos?new=1";

  return (
    <Link
      href={href}
      aria-label={onGoals ? "Nouvel objectif" : "Nouvelle tâche"}
      className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-[26px] leading-none text-white shadow-[0_8px_24px_rgb(79_70_229/40%)] transition-[background-color,transform] active:scale-[0.96] hover:bg-accent-hover focus-visible:ring-focus md:hidden"
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
