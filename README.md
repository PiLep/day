# Day — Vos objectifs, jour après jour

SaaS simple pour fixer des **objectifs**, les découper en **tâches** (todo list)
et les suivre dans un **calendrier** synchronisé avec **Google Calendar**.
UX pensée mobile *et* desktop : barre d'onglets en bas sur mobile, barre
latérale sur desktop.

## Fonctionnalités

- 🎯 **Objectifs** : titre, description, couleur, échéance, progression calculée
  à partir des tâches (barre de progression).
- ✅ **Todo list** : tâches rapides, rattachables à un objectif, avec ou sans date.
- 📅 **Calendrier mensuel** : les tâches datées apparaissent sur leurs jours ;
  un tap sur un jour ouvre la liste filtrée pour ajouter/cocher.
- 🔄 **Synchro Google Calendar** : chaque tâche datée devient un événement
  « journée entière » dans le calendrier principal (création, mise à jour,
  suppression, ✓ quand terminée). Synchro automatique à la création +
  bouton « Synchro Google » pour tout repousser.
- 📱 **Mobile-first** : navigation par onglets, safe-area iOS, cibles tactiles
  généreuses ; layout desktop avec sidebar.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, React 19)
- [Auth.js (NextAuth v5)](https://authjs.dev) — connexion Google OAuth
- [Prisma](https://prisma.io) — SQLite en dev, PostgreSQL en prod
- [Tailwind CSS v4](https://tailwindcss.com)
- Google Calendar API (REST, sans SDK)

## Démarrage

```bash
cp .env.example .env   # puis remplir les valeurs (voir ci-dessous)
npm install
npx prisma db push     # crée la base SQLite
npm run dev            # http://localhost:3000
```

### Configuration Google (obligatoire pour se connecter)

1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com).
2. Activez l'API **Google Calendar API**.
3. Écran de consentement OAuth : ajoutez les scopes `openid`, `email`,
   `profile` et `https://www.googleapis.com/auth/calendar.events`.
4. Créez un identifiant **OAuth 2.0 Client ID** (application Web) avec l'URI de
   redirection `http://localhost:3000/api/auth/callback/google`.
5. Renseignez `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` dans `.env`, et générez
   `AUTH_SECRET` avec `npx auth secret`.

### Production

- Passez `prisma/schema.prisma` sur `provider = "postgresql"` et pointez
  `DATABASE_URL` vers votre base.
- Définissez `AUTH_URL` sur votre domaine et ajoutez l'URI de redirection
  correspondante dans Google Cloud Console.

## Architecture

```
src/
  auth.ts                  # Config Auth.js (Google + scope Calendar)
  lib/
    prisma.ts              # Client Prisma singleton
    actions.ts             # Server Actions (CRUD objectifs/tâches, synchro)
    google-calendar.ts     # Synchro Google Calendar (refresh token, upsert/delete)
    queries.ts             # Helpers de requêtes/sérialisation
  app/
    page.tsx               # Landing + connexion Google
    app/                   # Espace connecté (guard dans layout.tsx)
      page.tsx             # Aujourd'hui : tâches du jour, retards, objectifs
      goals/               # Liste + détail d'objectif
      todos/               # Todo list complète (filtrable par date)
      calendar/            # Vue mensuelle
  components/              # UI (nav, tâches, formulaires, progression)
prisma/schema.prisma       # User/Account/Session + Goal + Task
```

La synchro calendrier est **best effort** : si Google est indisponible ou le
token expiré, l'app reste pleinement utilisable ; le bouton « Synchro Google »
rattrape le retard.

## CI / CD

Le workflow [`ci.yml`](.github/workflows/ci.yml) tourne sur chaque PR et sur
`main` :

| Job | Contenu |
| --- | --- |
| **Build** | `npm run build` (Prisma generate + Next build + type-check) |
| **Tests unitaires** | Vitest — `npm test` (`tests/unit/`) |
| **Sécurité** | `npm audit` (deps prod, high+) + scan de secrets gitleaks |
| **Tests e2e** | Playwright (Chromium, projets desktop + mobile, `tests/e2e/`) |
| **Deploy** | Uniquement sur push `main`, après succès des 4 jobs — déploie sur Vercel |

Commandes locales : `npm test` (unitaires) et `npm run test:e2e` (e2e ;
nécessite un `npm run build` préalable).

### Déploiement

Le job deploy utilise Vercel. Configurez ces secrets GitHub (Settings →
Secrets and variables → Actions) :

- `VERCEL_TOKEN` — token d'accès Vercel
- `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` — depuis `.vercel/project.json`
  après `vercel link`

Sans `VERCEL_TOKEN`, le job se termine en succès avec un avertissement (aucun
déploiement) — utile tant que l'hébergement n'est pas choisi.
