import { z } from "zod";
import { addDaysUTC, toDateString } from "@/lib/dates";
import {
  decomposeDiscipline,
  isDisciplineIntent,
  type HabitBlueprint,
} from "@/lib/habits";

/** Snapshot factuel du monde Day — le coach ne invente rien d'autre. */
export type CoachSnapshot = {
  todayLabel: string;
  todayCount: number;
  lateCount: number;
  undatedCount: number;
  goals: {
    id: string;
    title: string;
    done: number;
    total: number;
    targetDate: string | null;
    pendingTitles: string[];
  }[];
  lateTitles: string[];
};

export type CoachAction =
  | {
      type: "reschedule_late";
      label: string;
      keep: number;
      pushDays: number;
    }
  | {
      type: "create_goal_plan";
      label: string;
      title: string;
      tasks: { title: string; dueOffsetDays: number | null }[];
    }
  | {
      type: "create_goal_habits";
      label: string;
      title: string;
      habits: HabitBlueprint[];
    }
  | {
      type: "focus_today";
      label: string;
      taskTitles: string[];
    }
  | {
      type: "noop";
      label: string;
    };

export type CoachReply = {
  message: string;
  actions: CoachAction[];
};

const CHIP_INTENTS = {
  retards: /retard|rattrap|trop\s+de|d[eé]bord|en\s+retard/i,
  planifier: /aujourd.?hui|faire\s+quoi|focus|par\s+o[uù]\s+commencer|matin/i,
  objectif:
    /objectif|je\s+veux|j.?aimerais|lancer|apprendre|crire|sport|projet|cr[eé]er/i,
  aide: /^(aide|help|\?|salut|bonjour|hey)\b/i,
} as const;

/** Décompose un objectif en 3–5 petites tâches réalistes (sans LLM). */
export function decomposeGoal(raw: string): {
  title: string;
  tasks: { title: string; dueOffsetDays: number | null }[];
} {
  const cleaned = raw
    .replace(/^(je\s+veux|j.?aimerais|objectif\s*:?|cr[eé]er\s+)/i, "")
    .trim();
  const title =
    cleaned.length > 0
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : "Nouvel objectif";

  const lower = title.toLowerCase();
  let tasks: { title: string; dueOffsetDays: number | null }[];

  if (/sport|courir|course|muscu|salle|yoga/.test(lower)) {
    tasks = [
      { title: "Séance 1 — 20 à 30 min", dueOffsetDays: 0 },
      { title: "Séance 2 — même durée", dueOffsetDays: 2 },
      { title: "Séance 3 — noter comment je me sens", dueOffsetDays: 4 },
      { title: "Choisir un créneau fixe pour la semaine prochaine", dueOffsetDays: 7 },
    ];
  } else if (/crire|roman|livre|blog|article/.test(lower)) {
    tasks = [
      { title: "Écrire 300–500 mots", dueOffsetDays: 0 },
      { title: "Écrire encore 300–500 mots", dueOffsetDays: 2 },
      { title: "Relire et marquer 3 passages à retravailler", dueOffsetDays: 4 },
      { title: "Définir la prochaine scène / section", dueOffsetDays: 7 },
    ];
  } else if (/espagnol|anglais|langue|apprendre/.test(lower)) {
    tasks = [
      { title: "Leçon courte — 15 à 20 min", dueOffsetDays: 0 },
      { title: "Réviser 10 mots / phrases", dueOffsetDays: 1 },
      { title: "Leçon courte — 15 à 20 min", dueOffsetDays: 3 },
      { title: "Petite pratique orale ou écoute", dueOffsetDays: 5 },
    ];
  } else {
    tasks = [
      { title: `Premier pas concret pour « ${title} »`, dueOffsetDays: 0 },
      { title: "Deuxième petite étape (30 min max)", dueOffsetDays: 2 },
      { title: "Faire le point : garder, couper ou ajuster", dueOffsetDays: 5 },
      { title: "Planifier la semaine suivante en 2 actions", dueOffsetDays: 7 },
    ];
  }

  return { title: title.slice(0, 200), tasks };
}

/**
 * Coach déterministe : lit le snapshot, répond en FR calme,
 * propose au plus 2 actions concrètes.
 */
export function coachReply(input: string, snap: CoachSnapshot): CoachReply {
  const text = input.trim();
  if (!text) {
    return welcome(snap);
  }

  if (CHIP_INTENTS.aide.test(text) || text.length < 3) {
    return welcome(snap);
  }

  if (CHIP_INTENTS.retards.test(text) || (snap.lateCount >= 3 && /ok|oui|d.?accord|vas-y|ajuste/i.test(text))) {
    return replyLate(snap);
  }

  if (CHIP_INTENTS.planifier.test(text)) {
    return replyToday(snap);
  }

  if (CHIP_INTENTS.objectif.test(text) || text.length > 12) {
    // Objectif long terme → discipline jour/semaine, pas des tâches datées.
    if (isDisciplineIntent(text)) {
      return replyDiscipline(text);
    }
    if (
      CHIP_INTENTS.objectif.test(text) ||
      /^(écrire|apprendre|lancer|finir|préparer|courir)/i.test(text)
    ) {
      return replyNewGoal(text);
    }
  }

  // Par défaut : prioriser selon l'état réel
  if (snap.lateCount >= 3) return replyLate(snap);
  if (snap.todayCount === 0 && snap.goals.length > 0) return replyToday(snap);
  if (snap.goals.length === 0) return replyNewGoal(text.length > 8 ? text : "un premier objectif");
  return welcome(snap);
}

function welcome(snap: CoachSnapshot): CoachReply {
  if (snap.goals.length === 0) {
    return {
      message:
        "Bienvenue. Dis-moi un objectif simple — ex. « me remettre au sport » ou « écrire mon roman » — et je te propose 3–4 petites tâches réalistes.",
      actions: [
        {
          type: "create_goal_plan",
          label: "Exemple : me remettre au sport",
          title: "Me remettre au sport",
          tasks: decomposeGoal("me remettre au sport").tasks,
        },
      ],
    };
  }

  if (snap.lateCount >= 3) {
    return {
      message: `${snap.lateCount} tâches en retard. On reste proches du réel : on en garde 2 cette semaine et on décale le reste. Tu veux que je te propose ça ?`,
      actions: [
        {
          type: "reschedule_late",
          label: `Garder 2, décaler le reste (+7 j)`,
          keep: 2,
          pushDays: 7,
        },
      ],
    };
  }

  if (snap.todayCount === 0) {
    return {
      message: `Rien de daté pour ${snap.todayLabel}. On peut piocher 1–2 actions parmi tes objectifs — sans remplir la journée.`,
      actions: [
        {
          type: "focus_today",
          label: "Proposer 1–2 focus pour aujourd'hui",
          taskTitles: suggestFocusTitles(snap, 2),
        },
      ],
    };
  }

  return {
    message: `Tu as ${snap.todayCount} tâche${snap.todayCount > 1 ? "s" : ""} aujourd'hui${
      snap.lateCount > 0 ? ` et ${snap.lateCount} en retard` : ""
    }. Dis-moi si tu veux réajuster les retards, ou créer un nouvel objectif.`,
    actions:
      snap.lateCount > 0
        ? [
            {
              type: "reschedule_late",
              label: "Réajuster les retards",
              keep: Math.min(2, snap.lateCount),
              pushDays: 7,
            },
          ]
        : [],
  };
}

function replyLate(snap: CoachSnapshot): CoachReply {
  if (snap.lateCount === 0) {
    return {
      message: "Aucun retard pour l’instant. On garde le rythme actuel.",
      actions: [],
    };
  }
  const keep = Math.min(2, snap.lateCount);
  const sample = snap.lateTitles.slice(0, 3).map((t) => `« ${t} »`).join(", ");
  return {
    message: `${snap.lateCount} en retard${sample ? ` (${sample}${snap.lateCount > 3 ? "…" : ""})` : ""}. Proposition : garder ${keep} cette semaine, pousser le reste à +7 jours. Pas de culpabilité — juste un plan qui tient.`,
    actions: [
      {
        type: "reschedule_late",
        label: `Appliquer : garder ${keep}, décaler le reste`,
        keep,
        pushDays: 7,
      },
    ],
  };
}

function replyToday(snap: CoachSnapshot): CoachReply {
  if (snap.todayCount > 0 && snap.todayCount <= 3) {
    return {
      message: `Tu as déjà ${snap.todayCount} focus aujourd'hui — c’est raisonnable. Coche ce que tu peux ; le reste attendra demain.`,
      actions: [],
    };
  }
  if (snap.todayCount > 3) {
    return {
      message: `${snap.todayCount} tâches aujourd'hui, c’est beaucoup. Garde-en 2–3 max ; le coach peut t’aider à alléger via les retards plus tard.`,
      actions: [],
    };
  }
  const titles = suggestFocusTitles(snap, 2);
  if (titles.length === 0) {
    return {
      message:
        "Pas encore de tâches sur tes objectifs. Crée un objectif ou ajoute une tâche datée d’aujourd’hui.",
      actions: [],
    };
  }
  return {
    message: `Proposition pour aujourd'hui (max 2) : ${titles.map((t) => `« ${t} »`).join(" et ")}. On les date à aujourd’hui ?`,
    actions: [
      {
        type: "focus_today",
        label: "Dater ces focus à aujourd'hui",
        taskTitles: titles,
      },
    ],
  };
}

function replyNewGoal(raw: string): CoachReply {
  if (isDisciplineIntent(raw)) return replyDiscipline(raw);
  const plan = decomposeGoal(raw);
  return {
    message: `Objectif « ${plan.title} ». Voici un plan léger (4 pas). On peut l’appliquer tel quel — tu pourras tout modifier après.`,
    actions: [
      {
        type: "create_goal_plan",
        label: `Créer « ${plan.title} » + tâches`,
        title: plan.title,
        tasks: plan.tasks,
      },
    ],
  };
}

function replyDiscipline(raw: string): CoachReply {
  const plan = decomposeDiscipline(raw);
  const summary = plan.habits
    .map((h) =>
      h.kind === "DAILY"
        ? `« ${h.title} » chaque jour`
        : `« ${h.title} » ${h.target}× / sem.`
    )
    .join(", ");
  return {
    message: `Objectif long terme « ${plan.title} ». On pose une discipline, pas des cases one-shot : ${summary}. Tu pourras ajuster les quotas.`,
    actions: [
      {
        type: "create_goal_habits",
        label: `Créer « ${plan.title} » + discipline`,
        title: plan.title,
        habits: plan.habits,
      },
    ],
  };
}

function suggestFocusTitles(snap: CoachSnapshot, n: number): string[] {
  const fromGoals = snap.goals.flatMap((g) => g.pendingTitles.slice(0, 1));
  const fromLate = snap.lateTitles.slice(0, 1);
  return [...fromLate, ...fromGoals].filter(Boolean).slice(0, n);
}

export const coachActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reschedule_late"),
    label: z.string(),
    keep: z.number().int().min(0).max(10),
    pushDays: z.number().int().min(1).max(30),
  }),
  z.object({
    type: z.literal("create_goal_plan"),
    label: z.string(),
    title: z.string().min(1).max(200),
    tasks: z.array(
      z.object({
        title: z.string().min(1).max(300),
        dueOffsetDays: z.number().int().nullable(),
      })
    ),
  }),
  z.object({
    type: z.literal("create_goal_habits"),
    label: z.string(),
    title: z.string().min(1).max(200),
    habits: z.array(
      z.object({
        title: z.string().min(1).max(200),
        kind: z.enum(["DAILY", "WEEKLY"]),
        target: z.number().int().min(1).max(21),
      })
    ),
  }),
  z.object({
    type: z.literal("focus_today"),
    label: z.string(),
    taskTitles: z.array(z.string()),
  }),
  z.object({
    type: z.literal("noop"),
    label: z.string(),
  }),
]);

/** Helpers dates pour les actions coach (UTC jour). */
export function dueFromOffset(todayStart: Date, offset: number | null): Date | null {
  if (offset === null) return null;
  return addDaysUTC(todayStart, offset);
}

export function formatDueList(
  todayStart: Date,
  tasks: { title: string; dueOffsetDays: number | null }[]
): string {
  return tasks
    .map((t) => {
      if (t.dueOffsetDays === null) return `· ${t.title}`;
      return `· ${t.title} (${toDateString(addDaysUTC(todayStart, t.dueOffsetDays))})`;
    })
    .join("\n");
}
