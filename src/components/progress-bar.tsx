/**
 * Barre de progression (§04). Piste `track`, remplissage à la couleur de
 * l'objectif, transition de largeur 500 ms sur la courbe « glide ».
 */
const HEIGHTS = {
  sm: "h-[5px]",
  md: "h-1.5",
  lg: "h-2",
} as const;

export function ProgressBar({
  done,
  total,
  color,
  size = "md",
  className = "",
}: {
  done: number;
  total: number;
  color: string;
  size?: keyof typeof HEIGHTS;
  className?: string;
}) {
  const pct = percent(done, total);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${done} sur ${total} tâches terminées`}
      className={`${HEIGHTS[size]} overflow-hidden rounded-full bg-track ${className}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-glide"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Pourcentage entier d'un objectif — 0 quand il n'a encore aucune tâche. */
export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
