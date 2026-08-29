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
import { todayRangeUTC } from "@/lib/queries";
import { weekRangeUTC } from "@/lib/habits";

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

const habitSchema = z.object({
  title: z.string().trim().min(1).max(200),
  kind: z.enum(["DAILY", "WEEKLY"]),
  target: z.coerce.number().int().min(1).max(21),
});

export async function createHabit(formData: FormData) {
  const userId = await requireUserId();
  const parsed = habitSchema.safeParse({
    title: formData.get("title"),
    kind: formData.get("kind") || "DAILY",
    target: formData.get("target") || "1",
  });
  if (!parsed.success) return;

  const goalIdRaw = formData.get("goalId");
  const goalId =
    typeof goalIdRaw === "string" && goalIdRaw.length > 0
      ? (await prisma.goal.findFirst({ where: { id: goalIdRaw, userId } }))?.id ??
        null
      : null;

  const kind = parsed.data.kind;
  const target = kind === "DAILY" ? 1 : parsed.data.target;

  const maxOrder = await prisma.habit.aggregate({
    where: { userId, goalId: goalId ?? undefined },
    _max: { sortOrder: true },
  });

  await prisma.habit.create({
    data: {
      userId,
      goalId,
      title: parsed.data.title,
      kind,
      target,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/app", "layout");
}

/** Coche / décoche une habitude du jour (DAILY). */
export async function toggleHabitToday(habitId: string) {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit || habit.kind !== "DAILY") return;

  const { start } = todayRangeUTC();
  const existing = await prisma.habitLog.findFirst({
    where: { habitId, userId, occurredOn: start },
  });
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({
      data: { habitId, userId, occurredOn: start },
    });
  }
  revalidatePath("/app", "layout");
}

/** Ajoute une occurrence (quota hebdo, ou daily si pas encore fait). */
export async function logHabitOnce(habitId: string) {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return;

  const { start: today } = todayRangeUTC();
  const week = weekRangeUTC(today);

  if (habit.kind === "DAILY") {
    const existing = await prisma.habitLog.findFirst({
      where: { habitId, userId, occurredOn: today },
    });
    if (existing) return;
    await prisma.habitLog.create({
      data: { habitId, userId, occurredOn: today },
    });
    revalidatePath("/app", "layout");
    return;
  }

  const count = await prisma.habitLog.count({
    where: {
      habitId,
      userId,
      occurredOn: { gte: week.start, lt: week.end },
    },
  });
  if (count >= habit.target) return;

  await prisma.habitLog.create({
    data: { habitId, userId, occurredOn: today },
  });
  revalidatePath("/app", "layout");
}

/** Retire la dernière occurrence de la semaine. */
export async function unlogHabitOnce(habitId: string) {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return;

  const { start: today } = todayRangeUTC();
  const week = weekRangeUTC(today);

  if (habit.kind === "DAILY") {
    await prisma.habitLog.deleteMany({
      where: { habitId, userId, occurredOn: today },
    });
    revalidatePath("/app", "layout");
    return;
  }

  const last = await prisma.habitLog.findFirst({
    where: {
      habitId,
      userId,
      occurredOn: { gte: week.start, lt: week.end },
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
  });
  if (!last) return;
  await prisma.habitLog.delete({ where: { id: last.id } });
  revalidatePath("/app", "layout");
}

export async function deleteHabit(habitId: string) {
  const userId = await requireUserId();
  await prisma.habit.deleteMany({ where: { id: habitId, userId } });
  revalidatePath("/app", "layout");
}
