/**
 * Gouttières d'un écran de l'app : marge 20 sur mobile (§03), colonne centrée
 * et padding 48 sur desktop. La largeur maximale varie selon l'écran.
 */
const WIDTHS = {
  wide: "md:max-w-[1000px]",
  medium: "md:max-w-[820px]",
  narrow: "md:max-w-[780px]",
} as const;

export function PageShell({
  children,
  width = "wide",
  className = "",
}: {
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col px-5 pt-2.5 pb-[calc(112px+env(safe-area-inset-bottom))] md:px-12 md:pt-11 md:pb-11 ${WIDTHS[width]} ${className}`}
    >
      {children}
    </div>
  );
}
