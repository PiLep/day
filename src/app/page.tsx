import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-lg shadow-indigo-600/30">
        D
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Vos objectifs, jour après jour.
        </h1>
        <p className="text-lg text-zinc-600">
          Fixez un objectif, découpez-le en tâches, planifiez-les dans votre
          calendrier. Day se synchronise avec Google&nbsp;Calendar pour que
          tout soit au même endroit.
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/app" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-3 rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition hover:bg-zinc-700"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path
              fill="#fff"
              d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 3.9-5.35 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 3.95 1.55l2.2-2.2A9 9 0 1 0 12 21c5.2 0 8.85-3.65 8.85-8.8 0-.4-.2-.75-.5-1.1Z"
            />
          </svg>
          Continuer avec Google
        </button>
      </form>
      <ul className="grid gap-3 text-sm text-zinc-500 sm:grid-cols-3">
        <li className="rounded-xl border border-zinc-200 bg-white p-4">
          🎯 Objectifs avec suivi de progression
        </li>
        <li className="rounded-xl border border-zinc-200 bg-white p-4">
          ✅ Todo list simple et rapide
        </li>
        <li className="rounded-xl border border-zinc-200 bg-white p-4">
          📅 Synchro Google Calendar
        </li>
      </ul>
    </main>
  );
}
