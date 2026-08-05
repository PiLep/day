import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Day — Vos objectifs, un jour à la fois",
  description:
    "Day découpe vos grands projets en petites tâches planifiées, synchronisées avec Google Calendar. Chaque matin, vous savez par où commencer.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sans viewport-fit=cover, env(safe-area-inset-*) vaut 0 sur iOS et la
  // barre d'onglets passe sous l'indicateur d'accueil.
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
