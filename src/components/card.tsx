/** Surfaces du design system (§03) : bordure toujours présente, ombre en appui. */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Conteneur d'une liste de tâches. Le padding horizontal met les séparateurs
 * en retrait, comme sur les maquettes. `muted` sert aux listes « Terminées » :
 * bordure plus douce, pas d'ombre.
 */
export function ListCard({
  children,
  muted = false,
  className = "",
}: {
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border bg-surface px-3.5 py-0.5 md:px-[18px] ${
        muted ? "border-border-soft" : "border-border shadow-xs"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Intertitre de section : « À rattraper », « Terminées · 7 »… */
export function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>{children}</div>
  );
}
