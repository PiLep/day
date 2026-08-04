"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  syncTaskToCalendar,
  deleteTaskEvent,
  syncAllTasks as syncAll,
} from "@/lib/google-calendar";
import { parseDateInput as parseDate } from "@/lib/dates";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}

const goalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || "#6366f1",
  });
  if (!parsed.success) return;
  await prisma.goal.create({
    data: {
      userId,
      ...parsed.data,
      targetDate: parseDate(formData.get("targetDate")),
    },
  });
  revalidatePath("/app", "layout");
}

export async function updateGoal(goalId: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || "#6366f1",
  });
  if (!parsed.success) return;
  await prisma.goal.updateMany({
    where: { id: goalId, userId },
    data: { ...parsed.data, targetDate: parseDate(formData.get("targetDate")) },
  });
  revalidatePath("/app", "layout");
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
  revalidatePath("/app", "layout");
}
