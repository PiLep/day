import type { Metadata, Viewport } from "next";
import { Syne, Figtree } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Day — Un objectif. Des tâches. Aujourd'hui.",
  description:
    "L'organisateur perso le plus simple pour avancer vos objectifs, un jour à la fois. Solo. Calme. Synchronisé avec Google Calendar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1F6F5B",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${syne.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
