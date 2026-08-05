"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  syncTaskToCalendar,
  deleteTaskEvent,
  syncAllTasks as syncAll,
} from "@/lib/google-calendar";
import { parseDateInput as parseDate } from "@/lib/dates";
import { normalizeGoalColor } from "@/lib/goal-colors";
import { requireUserId } from "@/lib/session";

const goalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

/** La couleur est ramenée dans la palette des 6 plutôt que rejetée. */
function goalFields(formData: FormData) {
  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    color: normalizeGoalColor(formData.get("color")),
    targetDate: parseDate(formData.get("targetDate")),
  };
}

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const fields = goalFields(formData);
  if (!fields) return;
  await prisma.goal.create({ data: { userId, ...fields } });
  revalidatePath("/app", "layout");
  redirect("/app/goals");
}

export async function updateGoal(goalId: string, formData: FormData) {
  const userId = await requireUserId();
  const fields = goalFields(formData);
  if (!fields) return;
  await prisma.goal.updateMany({
    where: { id: goalId, userId },
    data: fields,
  });
  revalidatePath("/app", "layout");
  redirect(`/app/goals/${goalId}`);
}

export async function deleteGoal(goalId: string) {
  const userId = await requireUserId();
  const tasks = await prisma.task.findMany({
    where: { goalId, userId, googleEventId: { not: null } },
    select: { id: true },
  });
  await prisma.goal.deleteMany({ where: { id: goalId, userId } });
  // Les tâches restent (goalId → null) ; on nettoie juste rien côté Google.
  void tasks;
  revalidatePath("/app", "layout");
  redirect("/app/goals");
}

const taskSchema = z.object({
  title: z.string().trim().min(1).max(300),
});

export async function createTask(formData: FormData) {
  const userId = await requireUserId();
  const parsed = taskSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return;

  const goalId = formData.get("goalId");
  const task = await prisma.task.create({
    data: {
      userId,
      title: parsed.data.title,
      dueDate: parseDate(formData.get("dueDate")),
      goalId:
        typeof goalId === "string" && goalId.length > 0
          ? (await prisma.goal.findFirst({ where: { id: goalId, userId } }))?.id ?? null
          : null,
    },
  });
  if (task.dueDate) await syncTaskToCalendar(task.id);
  revalidatePath("/app", "layout");
}

export async function toggleTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return;
  await prisma.task.update({
    where: { id: taskId },
    data: { done: !task.done },
  });
  if (task.dueDate) await syncTaskToCalendar(taskId);
  revalidatePath("/app", "layout");
}

export async function updateTaskDueDate(taskId: string, formData: FormData) {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return;
  await prisma.task.update({
    where: { id: taskId },
    data: { dueDate: parseDate(formData.get("dueDate")) },
  });
  await syncTaskToCalendar(taskId);
  revalidatePath("/app", "layout");
}

export async function deleteTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return;
  if (task.googleEventId) await deleteTaskEvent(taskId);
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/app", "layout");
}

export async function syncAllTasks() {
  const userId = await requireUserId();
  await syncAll(userId);
  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncedAt: new Date() },
  });
  revalidatePath("/app", "layout");
}
