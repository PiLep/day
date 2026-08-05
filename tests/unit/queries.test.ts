import { describe, expect, it } from "vitest";
import { serializeTask, todayRangeUTC } from "@/lib/queries";

/** Mercredi 5 août 2026 — le « aujourd'hui » des maquettes. */
const TODAY = new Date("2026-08-05T09:41:00.000Z");

describe("serializeTask", () => {
  it("sérialise la date en ISO et conserve les champs", () => {
    const task = serializeTask(
      {
        id: "t1",
        title: "Courir 5 km",
        done: false,
        dueDate: new Date("2026-08-04T00:00:00.000Z"),
        googleEventId: "evt1",
        goal: { id: "g1", title: "Semi-marathon", color: "#10b981" },
      },
      TODAY
    );
    expect(task).toEqual({
      id: "t1",
      title: "Courir 5 km",
      done: false,
      dueDate: "2026-08-04T00:00:00.000Z",
      dateLabel: "hier",
      late: true,
      googleEventId: "evt1",
      goal: { id: "g1", title: "Semi-marathon", color: "#10b981" },
    });
  });

  it("gère l'absence de date et d'objectif", () => {
    const task = serializeTask(
      {
        id: "t2",
        title: "Sans date",
        done: true,
        dueDate: null,
        googleEventId: null,
        goal: null,
      },
      TODAY
    );
    expect(task.dueDate).toBeNull();
    expect(task.dateLabel).toBeNull();
    expect(task.late).toBe(false);
    expect(task.goal).toBeNull();
  });

  it("ne met jamais une tâche terminée « à rattraper »", () => {
    const task = serializeTask(
      {
        id: "t3",
        title: "Écrire 500 mots",
        done: true,
        dueDate: new Date("2026-07-30T00:00:00.000Z"),
        googleEventId: null,
        goal: null,
      },
      TODAY
    );
    expect(task.late).toBe(false);
    expect(task.dateLabel).toBe("jeu. 30 juil.");
  });
});

describe("todayRangeUTC", () => {
  it("retourne un intervalle de 24 h aligné sur minuit UTC", () => {
    const { start, end } = todayRangeUTC();
    expect(start.toISOString()).toMatch(/T00:00:00\.000Z$/);
    expect(end.getTime() - start.getTime()).toBe(86_400_000);
    const now = Date.now();
    expect(start.getTime()).toBeLessThanOrEqual(now);
    expect(end.getTime()).toBeGreaterThan(now);
  });
});
