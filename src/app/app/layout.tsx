import { requireSession } from "@/lib/session";
import { Fab, Sidebar, TabBar } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        <TabBar />
        <Fab />
      </div>
    </div>
  );
}
