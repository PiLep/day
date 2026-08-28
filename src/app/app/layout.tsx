import { requireSession } from "@/lib/session";
import { Fab, MobileAccountMenu, Sidebar, TabBar } from "@/components/app-nav";
import { CoachPanel } from "@/components/coach-panel";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  return (
    <div className="flex min-h-dvh">
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:shadow-md focus:ring-focus"
      >
        Aller au contenu
      </a>
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col md:pr-0">
        <MobileAccountMenu user={user} />
        <main
          id="contenu-principal"
          className="flex min-w-0 flex-1 flex-col"
          tabIndex={-1}
        >
          {children}
        </main>
        <TabBar />
        <Fab />
        <CoachPanel />
      </div>
    </div>
  );
}
