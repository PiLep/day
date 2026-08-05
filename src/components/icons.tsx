/**
 * Icônes du design system — tracés reportés à l'identique depuis les maquettes
 * (« Day - Ecrans », Sidebar et TabBar). Trait 1.8, bouts arrondis.
 */
type IconProps = {
  className?: string;
  strokeWidth?: number;
};

function Icon({
  className = "size-[18px]",
  strokeWidth = 1.8,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Aujourd'hui — un soleil. */
export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.8 5.8l1.5 1.5M16.7 16.7l1.5 1.5M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5" />
    </Icon>
  );
}

/** Objectifs — une cible. */
export function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="3.4" />
    </Icon>
  );
}

/** Tâches — une liste cochée. */
export function ChecklistIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g strokeLinejoin="round">
        <path d="M9.5 6h11M9.5 12h11M9.5 18h11" />
        <path d="M3.5 6.2l1.2 1.2 2-2.4" />
        <path d="M3.5 12.2l1.2 1.2 2-2.4" />
        <path d="M3.5 18.2l1.2 1.2 2-2.4" />
      </g>
    </Icon>
  );
}

/** Calendrier. */
export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8.3 3v4M15.7 3v4" />
    </Icon>
  );
}

/** Synchronisation Google Calendar. */
export function SyncIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path
        strokeLinejoin="round"
        d="M20 8a8 8 0 0 0-14.9-2M4 4v4h4M4 16a8 8 0 0 0 14.9 2M20 20v-4h-4"
      />
    </Icon>
  );
}

/** Déconnexion. */
export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        strokeLinejoin="round"
        d="M14.5 7.5V5.5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-2v-2M10 12h10m0 0-3-3m3 3-3 3"
      />
    </Icon>
  );
}

/** Coche des checkbox rondes — tracé sur une grille 12×12. */
export function CheckIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.5 6.5l2.4 2.4 4.6-5.4" />
    </svg>
  );
}
