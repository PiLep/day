import { describe, expect, it } from "vitest";
import { serializeTask, todayRangeUTC } from "@/lib/queries";

describe("serializeTask", () => {
  it("sérialise la date en ISO et conserve les champs", () => {
    const task = serializeTask({
      id: "t1",
      title: "Courir 5 km",
      done: false,
      dueDate: new Date("2026-08-04T00:00:00.000Z"),
      googleEventId: "evt1",
      goal: { id: "g1", title: "Semi-marathon", color: "#10b981" },
    });
    expect(task).toEqual({
      id: "t1",
      title: "Courir 5 km",
      done: false,
      dueDate: "2026-08-04T00:00:00.000Z",
      googleEventId: "evt1",
      goal: { id: "g1", title: "Semi-marathon", color: "#10b981" },
    });
  });

  it("gère l'absence de date et d'objectif", () => {
    const task = serializeTask({
      id: "t2",
      title: "Sans date",
      done: true,
      dueDate: null,
      googleEventId: null,
      goal: null,
    });
    expect(task.dueDate).toBeNull();
    expect(task.goal).toBeNull();
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
