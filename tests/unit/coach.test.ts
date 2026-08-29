import { describe, expect, it } from "vitest";
import { coachReply, decomposeGoal } from "@/lib/coach";
import type { CoachSnapshot } from "@/lib/coach";

const emptySnap = (): CoachSnapshot => ({
  todayLabel: "Mercredi 5 août",
  todayCount: 0,
  lateCount: 0,
  undatedCount: 0,
  goals: [],
  lateTitles: [],
});

describe("decomposeGoal", () => {
  it("propose un plan sport léger", () => {
    const plan = decomposeGoal("je veux me remettre au sport");
    expect(plan.title.toLowerCase()).toContain("sport");
    expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
    expect(plan.tasks[0]?.dueOffsetDays).toBe(0);
  });

  it("propose un plan écriture", () => {
    const plan = decomposeGoal("écrire un roman");
    expect(plan.tasks.some((t) => /mots|écrire/i.test(t.title))).toBe(true);
  });
});

describe("coachReply", () => {
  it("accueille sans objectifs", () => {
    const reply = coachReply("bonjour", emptySnap());
    expect(reply.message).toMatch(/objectif/i);
    expect(reply.actions.some((a) => a.type === "create_goal_plan")).toBe(true);
  });

  it("propose un réajustement quand il y a des retards", () => {
    const snap: CoachSnapshot = {
      ...emptySnap(),
      lateCount: 5,
      lateTitles: ["A", "B", "C", "D", "E"],
      goals: [
        {
          id: "g1",
          title: "Sport",
          done: 0,
          total: 3,
          targetDate: null,
          pendingTitles: ["Séance 1"],
        },
      ],
    };
    const reply = coachReply("réajuster mes retards", snap);
    expect(reply.actions[0]?.type).toBe("reschedule_late");
    if (reply.actions[0]?.type === "reschedule_late") {
      expect(reply.actions[0].keep).toBe(2);
      expect(reply.actions[0].pushDays).toBe(7);
    }
  });

  it("propose une discipline pour un objectif poids", () => {
    const snap: CoachSnapshot = {
      ...emptySnap(),
      goals: [
        {
          id: "g1",
          title: "Autre",
          done: 0,
          total: 1,
          targetDate: null,
          pendingTitles: ["x"],
        },
      ],
      todayCount: 1,
    };
    const reply = coachReply("je veux atteindre 80kg", snap);
    expect(reply.actions[0]?.type).toBe("create_goal_habits");
    if (reply.actions[0]?.type === "create_goal_habits") {
      expect(reply.actions[0].habits.some((h) => h.kind === "WEEKLY")).toBe(true);
      expect(reply.actions[0].habits.some((h) => h.kind === "DAILY")).toBe(true);
    }
  });

  it("crée un plan pour une intention d'objectif", () => {
    const snap: CoachSnapshot = {
      ...emptySnap(),
      goals: [
        {
          id: "g1",
          title: "Autre",
          done: 0,
          total: 1,
          targetDate: null,
          pendingTitles: ["x"],
        },
      ],
      todayCount: 1,
    };
    const reply = coachReply("je veux apprendre l'espagnol", snap);
    expect(reply.actions[0]?.type).toBe("create_goal_plan");
    if (reply.actions[0]?.type === "create_goal_plan") {
      expect(reply.actions[0].title.toLowerCase()).toMatch(/espagnol/);
      expect(reply.actions[0].tasks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("propose un focus quand la journée est vide", () => {
    const snap: CoachSnapshot = {
      ...emptySnap(),
      goals: [
        {
          id: "g1",
          title: "Roman",
          done: 0,
          total: 2,
          targetDate: null,
          pendingTitles: ["Écrire 300 mots", "Relire"],
        },
      ],
    };
    const reply = coachReply("que faire aujourd'hui ?", snap);
    expect(reply.actions[0]?.type).toBe("focus_today");
  });
});
