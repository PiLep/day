import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";
import { CheckIcon } from "@/components/icons";

function GoogleButton({
  className = "",
  label = "Continuer avec Google",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className={`landing-cta inline-flex h-12 items-center justify-center gap-2.5 rounded-[10px] bg-[var(--land-ink)] px-6 text-[15px] font-semibold text-[var(--land-paper)] transition-[transform,background-color] duration-200 hover:bg-[#0c1612] active:scale-[0.96] ${className}`}
      >
        <span
          className="flex size-5 items-center justify-center rounded-md bg-white/15 text-[11px] font-bold"
          aria-hidden
        >
          G
        </span>
        {label}
      </button>
    </form>
  );
}

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="landing min-h-dvh overflow-x-hidden bg-[var(--land-paper)] text-[var(--land-ink)]">
      {/* —— Hero : une composition, brand d'abord —— */}
      <header className="landing-hero relative isolate flex min-h-dvh flex-col">
        <div className="landing-sky pointer-events-none absolute inset-0 -z-10" aria-hidden />
        <div className="landing-grain pointer-events-none absolute inset-0 -z-10" aria-hidden />

        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] md:px-10 md:pt-8">
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-[-0.02em] md:text-[16px]">
            Day
          </span>
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="text-[13.5px] font-semibold text-[var(--land-mute)] transition-colors hover:text-[var(--land-ink)]"
            >
              Se connecter
            </button>
          </form>
        </div>

        <div className="flex w-full flex-1 flex-col justify-center pt-8 pb-0 md:pt-4">
          <div className="landing-rise grid w-full items-end gap-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)] md:gap-0">
            <div className="max-w-[34rem] px-5 md:px-10 md:pb-16 lg:pl-16">
              <p className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,18vw,9.5rem)] leading-[0.85] font-semibold tracking-[-0.055em]">
                Day
              </p>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(1.65rem,4.2vw,2.35rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance md:mt-6">
                Un objectif.
                <br />
                Des tâches.
                <br />
                Aujourd&apos;hui.
              </h1>
              <p className="mt-4 max-w-[28rem] text-[16px] leading-[1.55] text-[var(--land-mute)] text-pretty md:mt-5 md:text-[17px]">
                L&apos;organisateur perso qui enlève le bruit. Solo. Calme.
                Juste de quoi avancer — pas une usine à listes.
              </p>
              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center md:mt-8">
                <GoogleButton />
                <p className="text-[13px] text-[var(--land-mute)] sm:pl-1">
                  Gratuit · Google Calendar
                </p>
              </div>
            </div>

            {/* Plan visuel dominant : product UI plein bord droit */}
            <div className="landing-device relative min-h-[420px] w-full md:min-h-[560px]">
              <TodayPreview />
            </div>
          </div>
        </div>
      </header>

      {/* —— Une boucle, un job —— */}
      <section className="border-t border-[var(--land-line)] px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1120px]">
          <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-[0.08em] text-[var(--land-accent)] uppercase">
            La boucle
          </p>
          <h2 className="mt-3 max-w-[20ch] font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.12] font-semibold tracking-[-0.03em]">
            Moins d&apos;app. Plus de jours utiles.
          </h2>
          <ol className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
            {[
              {
                n: "01",
                title: "Posez un objectif",
                body: "Un titre, une couleur, une échéance. Pas de projets imbriqués à n’en plus finir.",
              },
              {
                n: "02",
                title: "Découpez en tâches",
                body: "De petites actions faisables, datées ou non. Chacune fait avancer la barre.",
              },
              {
                n: "03",
                title: "Ouvrez Aujourd’hui",
                body: "Le matin, vous voyez quoi faire — et quoi rattraper, sans culpabilité.",
              },
            ].map((step) => (
              <li key={step.n} className="landing-step">
                <span className="font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-[0.06em] text-[var(--land-accent)]">
                  {step.n}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-[var(--land-mute)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* —— Ce qu'on refuse —— */}
      <section className="landing-refuse relative px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-[0.08em] text-[var(--land-accent)] uppercase">
            Philosophie
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
            Plus c&apos;est simple, plus ça marche.
          </h2>
          <p className="mx-auto mt-5 max-w-[36rem] text-[16px] leading-[1.6] text-[var(--land-mute)] text-pretty">
            Pas d&apos;IA qui vole votre agenda. Pas d&apos;équipe, pas de
            labels, pas de streaks qui jugent. Day est l&apos;anti-usine&nbsp;:
            le minimum pour ne pas abandonner ce qui compte.
          </p>
          <ul className="mx-auto mt-10 flex max-w-[28rem] flex-col gap-3 text-left text-[15px] leading-[1.5]">
            {[
              "Deux maisons : Aujourd’hui et Objectifs",
              "Les retards en ambre, jamais en rouge",
              "Google Calendar en journée entière — miroir, pas maître",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 border-b border-[var(--land-line)] pb-3 last:border-0"
              >
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--land-accent)]"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* —— CTA final —— */}
      <section className="border-t border-[var(--land-line)] px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance">
              Commencez ce matin.
            </h2>
            <p className="mt-3 max-w-[28rem] text-[16px] leading-[1.55] text-[var(--land-mute)]">
              Un compte Google. Zéro configuration. Votre premier Aujourd’hui
              est prêt en une minute.
            </p>
          </div>
          <GoogleButton label="Essayer Day gratuitement" />
        </div>
        <p className="mx-auto mt-16 max-w-[1120px] text-[12.5px] text-[var(--land-mute)]">
          Day · © {new Date().getFullYear()}
        </p>
      </section>
    </div>
  );
}

/** Aperçu produit : l'écran Aujourd'hui — plan visuel plein bord. */
function TodayPreview() {
  return (
    <div className="landing-preview relative flex h-full min-h-[420px] w-full flex-col overflow-hidden border-t border-[var(--land-line)] bg-[var(--land-surface)] md:min-h-[560px] md:border-t-0 md:border-l">
      <div className="flex items-center justify-between border-b border-[var(--land-line)] px-5 py-3.5 md:px-8 md:py-4">
        <span className="font-[family-name:var(--font-display)] text-[14px] font-semibold tracking-[-0.02em]">
          Aujourd&apos;hui
        </span>
        <span className="text-[12px] font-medium text-[var(--land-mute)]">
          Objectifs
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-6 pb-8 md:px-8 md:pt-8">
        <p className="text-[11px] font-semibold tracking-[0.07em] text-[var(--land-mute)] uppercase">
          Vendredi 28 août
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-[-0.03em] md:text-[32px]">
          Bonjour
        </p>
        <p className="mt-1.5 text-[13.5px] text-[var(--land-mute)] md:text-[14.5px]">
          3 tâches pour avancer, à votre rythme.
        </p>

        <ul className="mt-7 flex flex-col md:mt-9">
          <PreviewTask title="Courir 5 km" goal="Sport" tone="emerald" />
          <PreviewTask title="Écrire 500 mots" goal="Roman" tone="forest" done />
          <PreviewTask
            title="Leçon d’espagnol — 20 min"
            goal="Espagnol"
            tone="sky"
            last
          />
        </ul>

        <div className="mt-auto pt-8">
          <div className="border-t border-[var(--land-line)] pt-5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--land-accent)]" />
              <span className="text-[13px] font-semibold md:text-[14px]">
                Écrire mon roman
              </span>
              <span className="tnum ml-auto text-[12px] font-semibold text-[var(--land-accent)] md:text-[13px]">
                58 %
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--land-track)]">
              <div className="landing-bar h-full w-[58%] rounded-full bg-[var(--land-accent)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewTask({
  title,
  goal,
  tone,
  done = false,
  last = false,
}: {
  title: string;
  goal: string;
  tone: "emerald" | "forest" | "sky";
  done?: boolean;
  last?: boolean;
}) {
  const badge = {
    emerald: "bg-[#d8f3e7] text-[#0f5c45]",
    forest: "bg-[#e2efe9] text-[#1F6F5B]",
    sky: "bg-[#ddeef6] text-[#1a5f7a]",
  }[tone];
  const fill = {
    emerald: "bg-[#1F9A6E]",
    forest: "bg-[var(--land-accent)]",
    sky: "bg-[#2A7A9B]",
  }[tone];

  return (
    <li
      className={`flex items-center gap-3 py-3 ${
        last ? "" : "border-b border-[var(--land-line)]"
      }`}
    >
      {done ? (
        <span
          className={`landing-check flex size-[22px] shrink-0 items-center justify-center rounded-full text-white ${fill}`}
        >
          <CheckIcon className="size-2.5" />
        </span>
      ) : (
        <span className="size-[22px] shrink-0 rounded-full border-[1.5px] border-[#c5cbc7]" />
      )}
      <span
        className={`min-w-0 flex-1 truncate text-[14.5px] ${
          done ? "text-[var(--land-mute)] line-through" : ""
        }`}
      >
        {title}
      </span>
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${
          done ? "bg-[var(--land-wash)] text-[var(--land-mute)]" : badge
        }`}
      >
        {goal}
      </span>
    </li>
  );
}
