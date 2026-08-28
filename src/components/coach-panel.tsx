"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { askCoach, applyCoachAction } from "@/lib/coach-actions";
import type { CoachAction, CoachReply } from "@/lib/coach";

type Bubble = {
  id: string;
  role: "user" | "coach";
  text: string;
  actions?: CoachAction[];
};

const QUICK = [
  "Réajuster mes retards",
  "Que faire aujourd'hui ?",
  "Je veux écrire un roman",
] as const;

/**
 * Coach Day — panneau bas (mobile) / colonne (desktop).
 * Propose des réajustements réalistes ; l'utilisateur confirme avant toute écriture.
 */
export function CoachPanel({ openOnMount = false }: { openOnMount?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(openOnMount);
  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [pending, startTransition] = useTransition();
  const [applying, setApplying] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const boot = useRef(false);

  useEffect(() => {
    if (boot.current) return;
    boot.current = true;
    startTransition(async () => {
      const reply = await askCoach("bonjour");
      setBubbles([
        {
          id: crypto.randomUUID(),
          role: "coach",
          text: reply.message,
          actions: reply.actions,
        },
      ]);
    });
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setInput("");
    setBubbles((b) => [
      ...b,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);
    startTransition(async () => {
      const reply = await askCoach(trimmed);
      setBubbles((b) => [
        ...b,
        {
          id: crypto.randomUUID(),
          role: "coach",
          text: reply.message,
          actions: reply.actions,
        },
      ]);
    });
  }

  function runAction(action: CoachAction, bubbleId: string) {
    setApplying(bubbleId);
    startTransition(async () => {
      const result = await applyCoachAction(action);
      setApplying(null);
      const follow: CoachReply = result.ok
        ? {
            message: "C’est appliqué. Tu peux encore ajuster à la main dans Aujourd’hui ou Objectifs.",
            actions: [],
          }
        : {
            message: result.error ?? "Impossible d’appliquer cette action.",
            actions: [],
          };
      setBubbles((b) => [
        ...b.map((x) =>
          x.id === bubbleId ? { ...x, actions: undefined } : x
        ),
        {
          id: crypto.randomUUID(),
          role: "coach",
          text: follow.message,
        },
      ]);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      {/* FAB coach — à gauche, le + reste à droite */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="day-coach"
        className={`fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-4 z-20 flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[13.5px] font-semibold text-ink shadow-md transition-[transform,opacity] hover:bg-bg focus-visible:ring-focus active:scale-[0.96] md:bottom-8 md:left-auto md:right-[calc(14rem+1.5rem)] ${
          open ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <span className="size-2 rounded-full bg-accent" aria-hidden />
        Coach
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-[rgb(24_24_27/35%)] md:bg-transparent"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        id="day-coach"
        role="dialog"
        aria-label="Coach Day"
        aria-modal="true"
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[min(78dvh,640px)] flex-col rounded-t-[24px] border border-border bg-surface shadow-lg transition-transform duration-300 md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-t-0 md:shadow-none ${
          open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em]">Coach</p>
            <p className="text-[12px] text-ink-2">Réajuste pour rester réaliste</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 items-center rounded-md px-3 text-[13px] font-semibold text-ink-2 hover:bg-zinc-100 focus-visible:ring-focus"
          >
            Fermer
          </button>
        </div>

        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {bubbles.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col gap-2 ${
                b.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-[14px] px-3.5 py-2.5 text-[14px] leading-[1.45] ${
                  b.role === "user"
                    ? "bg-ink text-white"
                    : "bg-zinc-100 text-ink"
                }`}
              >
                {b.text}
              </div>
              {b.actions && b.actions.length > 0 && (
                <div className="flex max-w-[92%] flex-col gap-2">
                  {b.actions.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={pending || applying === b.id}
                      onClick={() => runAction(a, b.id)}
                      className="rounded-[12px] border border-accent bg-accent-soft px-3.5 py-2.5 text-left text-[13px] font-semibold text-accent-hover transition-colors hover:bg-accent-100 focus-visible:ring-focus disabled:opacity-60"
                    >
                      {applying === b.id ? "Application…" : a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {pending && applying === null && (
            <p className="text-[12.5px] text-ink-3">Le coach réfléchit…</p>
          )}
        </div>

        <div className="border-t border-border px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                disabled={pending}
                onClick={() => send(q)}
                className="shrink-0 rounded-full border border-border bg-bg px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:bg-zinc-100 focus-visible:ring-focus"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="coach-input" className="sr-only">
              Message au coach
            </label>
            <input
              id="coach-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Dis ce que tu veux avancer…"
              className="h-11 min-w-0 flex-1 rounded-[12px] border border-border bg-bg px-3.5 text-[14px] outline-none focus:border-accent focus:ring-focus"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="h-11 shrink-0 rounded-[12px] bg-accent px-4 text-[13.5px] font-semibold text-white hover:bg-accent-hover focus-visible:ring-focus disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
