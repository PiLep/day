import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";
import { CalendarIcon, CheckIcon } from "@/components/icons";
import { DayMark } from "@/components/app-nav";

/** Bouton « Continuer avec Google » — le seul chemin d'entrée. */
function GoogleButton({ className = "" }: { className?: string }) {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className={`flex h-12 items-center justify-center gap-2.5 rounded-md border border-border bg-surface text-[14.5px] font-semibold shadow-xs transition-colors hover:border-zinc-300 hover:bg-[#fcfcfd] ${className}`}
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-600">
          G
        </span>
        Continuer avec Google
      </button>
    </form>
  );
}

const FEATURES = [
  {
    title: "Découpez",
    body: "Un grand objectif devient une suite de petites tâches faisables, chacune reliée par sa couleur.",
    tile: "bg-[#ede9fe]",
    art: <span className="size-3 rounded-full bg-goal-violet" />,
  },
  {
    title: "Planifiez",
    body: "Les tâches datées se posent sur le calendrier, synchronisées avec Google Calendar en journée entière.",
    tile: "bg-[#e0f2fe]",
    art: <CalendarIcon className="size-4 text-[#0369a1]" strokeWidth={2} />,
  },
  {
    title: "Avancez",
    body: "Chaque tâche cochée fait grandir la barre de progression. Sans pression, sans culpabilité.",
    tile: "bg-[#d1fae5]",
    art: <span className="h-[5px] w-3.5 rounded-full bg-goal-emerald" />,
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 py-2.5 md:px-12 md:py-5">
        <div className="flex items-center gap-2 md:gap-2.5">
          <DayMark size={22} />
          <span className="text-[15px] font-semibold md:text-[16px]">Day</span>
        </div>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-[38px] items-center rounded-md px-2 text-[13.5px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 md:px-4"
          >
            Se connecter
          </button>
        </form>
      </header>

      {/* Héros — centré sur mobile, deux colonnes sur desktop. */}
      <section className="mx-auto flex max-w-[1100px] flex-col items-center px-6 pt-9 text-center md:flex-row md:gap-[72px] md:px-12 md:pt-13 md:text-left">
        <div className="md:max-w-[460px] md:flex-1">
          <h1 className="text-[31px] leading-[1.18] font-semibold tracking-[-0.02em] md:text-[46px] md:leading-[1.12] md:tracking-[-0.025em]">
            Vos objectifs,
            <br />
            un jour à la fois.
          </h1>
          <p className="mt-3.5 text-[14.5px] leading-[1.6] text-ink-2 md:mt-[18px] md:text-[16px] md:text-pretty">
            Day découpe vos grands projets en petites tâches planifiées. Chaque
            matin, vous savez par où commencer
            <span className="hidden md:inline"> — sans liste qui culpabilise</span>.
          </p>
          <GoogleButton className="mt-6 w-full md:mt-7 md:w-auto md:px-[22px]" />
          <p className="mt-2.5 text-[12px] text-ink-3 md:mt-3 md:text-[12.5px]">
            Gratuit · Synchronisé avec Google Calendar
          </p>
        </div>

        {/* Aperçu de l'écran « Aujourd'hui » — desktop uniquement. */}
        <div className="hidden w-[400px] shrink-0 rounded-[20px] border border-border bg-surface px-[26px] pt-[26px] pb-5 shadow-[0_12px_40px_rgb(24_24_27/10%)] md:block">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-ink-3 uppercase">
            Mercredi 5 août
          </p>
          <p className="mt-1 mb-4 text-[24px] font-semibold tracking-[-0.02em]">
            Bonjour
          </p>
          <PreviewRow title="Courir 5 km" badge="Sport" tone="emerald" />
          <PreviewRow title="Écrire 500 mots" badge="Roman" tone="violet" done />
          <PreviewRow
            title="Leçon d'espagnol — 20 min"
            badge="Espagnol"
            tone="sky"
            last
          />
          <div className="mt-4 flex items-center gap-2.5 rounded-md border border-border-soft bg-bg px-3.5 py-3">
            <span className="size-[9px] rounded-full bg-goal-violet" />
            <span className="text-[12.5px] font-semibold">Écrire mon roman</span>
            <div className="mx-1 h-[5px] flex-1 overflow-hidden rounded-full bg-track">
              <div className="h-full w-[58%] rounded-full bg-goal-violet" />
            </div>
            <span className="tnum text-[11.5px] font-semibold text-[#6d28d9]">
              58 %
            </span>
          </div>
        </div>
      </section>

      {/* Trois piliers. Sur mobile chaque carte porte sa propre illustration. */}
      <section className="mx-auto grid max-w-[1100px] gap-3.5 px-5 pt-7 pb-8 md:grid-cols-3 md:gap-5 md:px-12 md:pt-14">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="rounded-lg border border-border bg-surface p-5 md:p-[22px]"
          >
            <div
              className={`hidden size-[34px] items-center justify-center rounded-md md:flex ${f.tile}`}
            >
              {f.art}
            </div>
            <p className="text-[14.5px] font-semibold md:mt-3">{f.title}</p>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">{f.body}</p>
            <div className="md:hidden">{MOBILE_ART[i]}</div>
          </div>
        ))}
        <p className="pt-2.5 text-center text-[11.5px] text-ink-3 md:hidden">
          Day · © {new Date().getFullYear()}
        </p>
      </section>
    </div>
  );
}

function PreviewRow({
  title,
  badge,
  tone,
  done = false,
  last = false,
}: {
  title: string;
  badge: string;
  tone: "emerald" | "violet" | "sky";
  done?: boolean;
  last?: boolean;
}) {
  const badgeTone = {
    emerald: "bg-[#d1fae5] text-[#047857]",
    violet: "bg-[#ede9fe] text-[#6d28d9]",
    sky: "bg-[#e0f2fe] text-[#0369a1]",
  }[tone];
  const fill = {
    emerald: "bg-goal-emerald",
    violet: "bg-goal-violet",
    sky: "bg-goal-sky",
  }[tone];

  return (
    <div
      className={`flex items-center gap-[11px] py-2.5 ${
        last ? "" : "border-b border-[#efeff1]"
      }`}
    >
      {done ? (
        <span
          className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white ${fill}`}
        >
          <CheckIcon className="size-2.5" />
        </span>
      ) : (
        <span className="size-5 shrink-0 rounded-full border-[1.5px] border-zinc-300" />
      )}
      <span className={`text-[14px] ${done ? "text-ink-3 line-through" : ""}`}>
        {title}
      </span>
      <span
        className={`ml-auto shrink-0 rounded-[6px] px-[7px] py-[3px] text-[10.5px] font-semibold ${
          done ? "bg-zinc-100 text-ink-3" : badgeTone
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

/** Illustrations des cartes mobiles (écran 1 · mobile). */
const MOBILE_ART = [
  <div
    key="decoupez"
    className="mt-3 rounded-md border border-border-soft bg-bg px-3.5 py-3"
  >
    <div className="flex items-center gap-2">
      <span className="size-[9px] rounded-full bg-goal-violet" />
      <span className="text-[13px] font-semibold">Écrire mon roman</span>
      <span className="tnum ml-auto text-[11.5px] font-semibold text-[#6d28d9]">
        58 %
      </span>
    </div>
    <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-track">
      <div className="h-full w-[58%] rounded-full bg-goal-violet" />
    </div>
    <div className="mt-3 flex items-center gap-2.5">
      <span className="flex size-4 items-center justify-center rounded-full bg-goal-violet text-white">
        <CheckIcon className="size-[9px]" />
      </span>
      <span className="text-[12.5px] text-ink-3 line-through">Écrire 500 mots</span>
    </div>
    <div className="mt-2 flex items-center gap-2.5">
      <span className="size-4 rounded-full border-[1.5px] border-zinc-300" />
      <span className="text-[12.5px]">Relire le chapitre 1</span>
    </div>
  </div>,
  <div
    key="planifiez"
    className="mt-3 grid grid-cols-7 gap-1 rounded-md border border-border-soft bg-bg p-2.5"
  >
    {[
      { n: 3, dots: ["bg-goal-violet"] },
      { n: 4, dots: ["bg-goal-amber"] },
      { n: 5, dots: ["bg-goal-emerald", "bg-goal-violet"], today: true },
      { n: 6, dots: [] },
      { n: 7, dots: ["bg-goal-emerald"] },
      { n: 8, dots: ["bg-goal-amber"] },
      { n: 9, dots: [] },
    ].map((d) => (
      <div
        key={d.n}
        className="flex h-[34px] flex-col items-center justify-center gap-[3px]"
      >
        {d.today ? (
          <span className="tnum flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
            {d.n}
          </span>
        ) : (
          <span className="tnum text-[11px] text-ink-3">{d.n}</span>
        )}
        <span className="flex gap-0.5">
          {d.dots.map((c, i) => (
            <span key={i} className={`size-1 rounded-full ${c}`} />
          ))}
        </span>
      </div>
    ))}
  </div>,
  <div
    key="avancez"
    className="mt-3 flex flex-col gap-2.5 rounded-md border border-border-soft bg-bg p-3.5"
  >
    {[
      {
        label: "Me remettre au sport",
        pct: 40,
        fill: "bg-goal-emerald",
        ink: "text-[#047857]",
      },
      {
        label: "Rénover le salon",
        pct: 80,
        fill: "bg-goal-amber",
        ink: "text-[#b45309]",
      },
    ].map((g) => (
      <div key={g.label}>
        <div className="mb-1 flex justify-between text-[11.5px]">
          <span className="font-semibold text-zinc-600">{g.label}</span>
          <span className={`tnum font-semibold ${g.ink}`}>{g.pct} %</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-track">
          <div
            className={`h-full rounded-full ${g.fill}`}
            style={{ width: `${g.pct}%` }}
          />
        </div>
      </div>
    ))}
  </div>,
];
