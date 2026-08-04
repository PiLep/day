"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/app",
    label: "Aujourd'hui",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 10.5 9-7.5 9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z"
      />
    ),
  },
  {
    href: "/app/goals",
    label: "Objectifs",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" strokeLinecap="round" />
        <circle cx="12" cy="12" r="5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </>
    ),
  },
  {
    href: "/app/todos",
    label: "Tâches",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"
      />
    ),
  },
  {
    href: "/app/calendar",
    label: "Calendrier",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3v3m10-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
      />
    ),
  },
];

export function NavLinks({
  orientation,
}: {
  orientation: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  if (orientation === "vertical") {
    return (
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(l.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-5"
                aria-hidden
              >
                {l.icon}
              </svg>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-4">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              isActive(l.href) ? "text-indigo-600" : "text-zinc-500"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-6"
              aria-hidden
            >
              {l.icon}
            </svg>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
