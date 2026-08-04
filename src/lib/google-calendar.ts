import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/**
 * Retourne un access token Google valide pour l'utilisateur,
 * en le rafraîchissant via le refresh_token si nécessaire.
 * Retourne null si l'utilisateur n'a pas connecté Google Calendar.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) return null;

  const stillValid =
    account.expires_at && account.expires_at * 1000 > Date.now() + 60_000;
  if (stillValid) return account.access_token;
  if (!account.refresh_token) return account.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });
  if (!res.ok) return null;

  const data: { access_token: string; expires_in: number } = await res.json();
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });
  return data.access_token;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eventBody(task: Task & { goal?: { title: string } | null }) {
  const start = toDateString(task.dueDate!);
  const end = new Date(task.dueDate!);
  end.setUTCDate(end.getUTCDate() + 1); // convention Google : fin exclusive pour les événements journée entière
  return {
    summary: task.done ? `✓ ${task.title}` : task.title,
    description: task.goal ? `Objectif : ${task.goal.title} — via Day` : "via Day",
    start: { date: start },
    end: { date: toDateString(end) },
  };
}

/**
 * Crée ou met à jour l'événement Google Calendar d'une tâche datée.
 * Ne lève jamais : la synchro est "best effort", l'app reste utilisable sans.
 */
export async function syncTaskToCalendar(taskId: string): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { goal: { select: { title: true } } },
    });
    if (!task) return false;

    const token = await getGoogleAccessToken(task.userId);
    if (!token) return false;

    // Tâche sans date : supprimer l'événement existant le cas échéant.
    if (!task.dueDate) {
      if (task.googleEventId) await deleteTaskEvent(taskId);
      return true;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    if (task.googleEventId) {
      const res = await fetch(`${CALENDAR_API}/${task.googleEventId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(eventBody(task)),
      });
      if (res.ok) return true;
      if (res.status !== 404 && res.status !== 410) return false;
      // L'événement a été supprimé côté Google : on le recrée.
    }

    const res = await fetch(CALENDAR_API, {
      method: "POST",
      headers,
      body: JSON.stringify(eventBody(task)),
    });
    if (!res.ok) return false;
    const event: { id: string } = await res.json();
    await prisma.task.update({
      where: { id: task.id },
      data: { googleEventId: event.id },
    });
    return true;
  } catch {
    return false;
  }
}

/** Supprime l'événement Google Calendar associé à une tâche. */
export async function deleteTaskEvent(taskId: string): Promise<void> {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task?.googleEventId) return;
    const token = await getGoogleAccessToken(task.userId);
    if (!token) return;
    await fetch(`${CALENDAR_API}/${task.googleEventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await prisma.task.update({
      where: { id: taskId },
      data: { googleEventId: null },
    });
  } catch {
    // best effort
  }
}

/** Pousse toutes les tâches datées non terminées de l'utilisateur vers Google Calendar. */
export async function syncAllTasks(userId: string): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { userId, dueDate: { not: null } },
    select: { id: true },
  });
  let synced = 0;
  for (const t of tasks) {
    if (await syncTaskToCalendar(t.id)) synced++;
  }
  return synced;
}
