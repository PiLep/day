/**
 * Les 6 couleurs d'objectif du design system (§01).
 *
 * Chaque couleur se décline en trio : `base` (pastille, barre, point de
 * calendrier), `soft` (fond de badge et d'événement) et `deep` (texte posé sur
 * `soft`). Le rouge vif est volontairement exclu de la palette — l'ambre porte
 * le « à rattraper ».
 */
export type GoalColorTrio = {
  base: string;
  soft: string;
  deep: string;
};

export type GoalColor = GoalColorTrio & {
  name: string;
  /** Libellé pour les lecteurs d'écran du sélecteur de couleur. */
  label: string;
};

export const GOAL_COLORS: readonly GoalColor[] = [
  { name: "indigo", label: "Indigo", base: "#6366f1", soft: "#e0e7ff", deep: "#4338ca" },
  { name: "sky", label: "Ciel", base: "#0ea5e9", soft: "#e0f2fe", deep: "#0369a1" },
  { name: "emerald", label: "Émeraude", base: "#10b981", soft: "#d1fae5", deep: "#047857" },
  { name: "amber", label: "Ambre", base: "#f59e0b", soft: "#fef3c7", deep: "#b45309" },
  { name: "rose", label: "Rose", base: "#f43f5e", soft: "#ffe4e6", deep: "#be123c" },
  { name: "violet", label: "Violet", base: "#8b5cf6", soft: "#ede9fe", deep: "#6d28d9" },
] as const;

export const DEFAULT_GOAL_COLOR = GOAL_COLORS[0].base;

/** Neutre des tâches sans objectif (§04 · TaskItem, checkbox « sans objectif »). */
export const NO_GOAL_TRIO: GoalColorTrio = {
  base: "#71717a",
  soft: "#f4f4f5",
  deep: "#71717a",
};

/** Badge d'une tâche terminée : la couleur de l'objectif s'efface. */
export const DONE_TRIO: GoalColorTrio = {
  base: "#71717a",
  soft: "#f4f4f5",
  deep: "#a1a1aa",
};

/**
 * Résout le trio d'une couleur d'objectif.
 *
 * Les 6 couleurs de la palette renvoient leurs teintes exactes. Une couleur
 * héritée hors palette (les objectifs créés avant ce design system) garde sa
 * teinte : `soft` et `deep` sont alors dérivés pour rester lisibles.
 */
export function goalTrio(hex: string | null | undefined): GoalColorTrio {
  if (!hex) return NO_GOAL_TRIO;
  const value = hex.trim().toLowerCase();
  const known = GOAL_COLORS.find((c) => c.base === value);
  if (known) return { base: known.base, soft: known.soft, deep: known.deep };
  return {
    base: value,
    soft: `color-mix(in oklab, ${value} 15%, white)`,
    deep: `color-mix(in oklab, ${value} 72%, black)`,
  };
}

/** Ramène une couleur reçue d'un formulaire dans la palette. */
export function normalizeGoalColor(value: unknown): string {
  const hex = typeof value === "string" ? value.trim().toLowerCase() : "";
  return GOAL_COLORS.some((c) => c.base === hex) ? hex : DEFAULT_GOAL_COLOR;
}

/**
 * Variables CSS du trio, à poser sur un conteneur pour que ses enfants
 * s'y réfèrent via `bg-(--goal-soft)`, `text-(--goal-deep)`, etc.
 */
export function goalVars(
  trio: GoalColorTrio
): Record<"--goal" | "--goal-soft" | "--goal-deep", string> {
  return {
    "--goal": trio.base,
    "--goal-soft": trio.soft,
    "--goal-deep": trio.deep,
  };
}
