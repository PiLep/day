"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { todayRangeUTC } from "@/lib/queries";
import { dayHeading, addDaysUTC, startOfDayUTC } from "@/lib/dates";
import { DEFAULT_GOAL_COLOR, normalizeGoalColor } from "@/lib/goal-colors";
import { syncTaskToCalendar } from "@/lib/google-calendar";
import {
  coachReply,
  coachActionSchema,
  dueFromOffset,
  type CoachAction,
  type CoachReply,
  type CoachSnapshot,
} from "@/lib/coach";

async function loadSnapshot(userId: string): Promise<{ snap: CoachSnapshot; todayStart: Date }> {
  const { start, end } = todayRangeUTC();
  const [todayTasks, lateTasks, undated, goals] = await Promise.all([
    prisma.task.count({
      where: { userId, done: false, dueDate: { gte: start, lt: end } },
    }),
    prisma.task.findMany({
      where: { userId, done: false, dueDate: { lt: start } },
      select: { title: true },
      orderBy: { dueDate: "desc" },
      take: 20,
    }),
    prisma.task.count({
      where: { userId, done: false, dueDate: null },
    }),
    prisma.goal.findMany({
      where: { userId, archived: false },
      include: {
        tasks: {
          where: { done: false },
          select: { title: true },
          orderBy: { createdAt: "asc" },
          take: 5,
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const goalRows = await Promise.all(
    goals.map(async (g) => {
      const done = await prisma.task.count({
        where: { goalId: g.id, userId, done: true },
      });
      return {
        id: g.id,
        title: g.title,
        done,
        total: g._count.tasks,
        targetDate: g.targetDate ? g.targetDate.toISOString().slice(0, 10) : null,
        pendingTitles: g.tasks.map((t) => t.title),
      };
    })
  );

  return {
    todayStart: start,
    snap: {
      todayLabel: dayHeading(start),
      todayCount: todayTasks,
      lateCount: lateTasks.length,
      undatedCount: undated,
      goals: goalRows,
      lateTitles: lateTasks.map((t) => t.title),
    },
  };
}

/** Message libre → réponse coach + actions proposées. */
export async function askCoach(message: string): Promise<CoachReply> {
  const userId = await requireUserId();
  const { snap } = await loadSnapshot(userId);

  // LLM optionnel : enrichit le plan d'objectif si une clé est présente.
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && message.trim().length > 8) {
    try {
      const enhanced = await enhanceWithLlm(message, snap, apiKey);
      if (enhanced) return enhanced;
    } catch {
      // Fallback déterministe — l'app ne dépend jamais du LLM.
    }
  }

  return coachReply(message, snap);
}

async function enhanceWithLlm(
  message: string,
  snap: CoachSnapshot,
  apiKey: string
): Promise<CoachReply | null> {
  const { generateText } = await import("ai");
  const { createOpenAI } = await import("@ai-sdk/openai");
  const openai = createOpenAI({ apiKey });

  const context = JSON.stringify({
    todayCount: snap.todayCount,
    lateCount: snap.lateCount,
    goals: snap.goals.map((g) => ({
      title: g.title,
      done: g.done,
      total: g.total,
    })),
  });

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Tu es Day, coach d'organisation perso en français. Calme, direct, jamais culpabilisant.
Tu aides à rester proche du réel : plans petits, réajustements, pas de hustle.
Contexte JSON de l'utilisateur: ${context}
Réponds en 1–3 phrases courtes. Si l'utilisateur veut un objectif, termine par une ligne:
PLAN: titre de l'objectif | tâche1 | tâche2 | tâche3
Sinon ne mets pas PLAN.`,
    prompt: message,
  });

  const planMatch = text.match(/PLAN:\s*(.+)$/im);
  const messageClean = text.replace(/\n?PLAN:.*$/im, "").trim();

  if (planMatch) {
    const parts = planMatch[1]!.split("|").map((s) => s.trim()).filter(Boolean);
    const title = parts[0] ?? "Nouvel objectif";
    const tasks = parts.slice(1, 5).map((t, i) => ({
      title: t,
      dueOffsetDays: i === 0 ? 0 : i * 2,
    }));
    if (tasks.length === 0) return null;
    return {
      message: messageClean || `Voici un plan léger pour « ${title} ».`,
      actions: [
        {
          type: "create_goal_plan",
          label: `Créer « ${title} » + tâches`,
          title,
          tasks,
        },
      ],
    };
  }

  // Pas de plan LLM → on garde le message LLM mais on ajoute actions déterministes
  const base = coachReply(message, snap);
  return { message: messageClean || base.message, actions: base.actions };
}

/** Applique une action coach confirmée par l'utilisateur. */
export async function applyCoachAction(raw: CoachAction): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = coachActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Action invalide." };

  const userId = await requireUserId();
  const action = parsed.data;
  const { start } = todayRangeUTC();

  if (action.type === "noop") return { ok: true };

  if (action.type === "reschedule_late") {
    const late = await prisma.task.findMany({
      where: { userId, done: false, dueDate: { lt: start } },
      orderBy: { dueDate: "desc" },
    });
    const toPush = late.slice(action.keep);
    for (const task of toPush) {
      const next = addDaysUTC(start, action.pushDays);
      await prisma.task.update({
        where: { id: task.id },
        data: { dueDate: next },
      });
      if (task.dueDate || task.googleEventId) await syncTaskToCalendar(task.id);
    }
    revalidatePath("/app", "layout");
    return { ok: true };
  }

  if (action.type === "create_goal_plan") {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: action.title,
        color: normalizeGoalColor(DEFAULT_GOAL_COLOR),
      },
    });
    for (const t of action.tasks) {
      const due = dueFromOffset(start, t.dueOffsetDays);
      const task = await prisma.task.create({
        data: {
          userId,
          goalId: goal.id,
          title: t.title,
          dueDate: due,
        },
      });
      if (due) await syncTaskToCalendar(task.id);
    }
    revalidatePath("/app", "layout");
    return { ok: true };
  }

  if (action.type === "create_goal_habits") {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: action.title,
        color: normalizeGoalColor(DEFAULT_GOAL_COLOR),
      },
    });
    let order = 0;
    for (const h of action.habits) {
      await prisma.habit.create({
        data: {
          userId,
          goalId: goal.id,
          title: h.title,
          kind: h.kind,
          target: h.kind === "DAILY" ? 1 : h.target,
          sortOrder: order++,
        },
      });
    }
    revalidatePath("/app", "layout");
    return { ok: true };
  }

  if (action.type === "focus_today") {
    // Date à aujourd'hui les tâches pending dont le titre matche (parmi objectifs / undated / late)
    for (const title of action.taskTitles) {
      const task = await prisma.task.findFirst({
        where: {
          userId,
          done: false,
          title,
        },
        orderBy: { createdAt: "asc" },
      });
      if (!task) continue;
      await prisma.task.update({
        where: { id: task.id },
        data: { dueDate: startOfDayUTC(start) },
      });
      await syncTaskToCalendar(task.id);
    }
    revalidatePath("/app", "layout");
    return { ok: true };
  }

  return { ok: true };
}
