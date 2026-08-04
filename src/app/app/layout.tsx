import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { NavLinks } from "@/components/nav-links";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      {/* Barre latérale — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-white p-4 md:flex">
        <Link href="/app" className="flex items-center gap-2 px-2 font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            D
          </span>
          Day
        </Link>
        <NavLinks orientation="vertical" />
        <div className="mt-auto flex items-center gap-2 px-2">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session.user.name}</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-xs text-zinc-500 hover:text-zinc-900">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tête — mobile */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/app" className="flex items-center gap-2 font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
              D
            </span>
            Day
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="text-xs text-zinc-500">Se déconnecter</button>
          </form>
        </header>

        <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</main>

        {/* Barre d'onglets — mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <NavLinks orientation="horizontal" />
        </nav>
      </div>
    </div>
  );
}
