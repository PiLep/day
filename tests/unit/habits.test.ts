import { describe, expect, it } from "vitest";
import {
  startOfWeekUTC,
  endOfWeekUTC,
  habitWeekScore,
  habitsWeekProgress,
  decomposeDiscipline,
  isDisciplineIntent,
} from "@/lib/habits";

describe("startOfWeekUTC", () => {
  it("place le lundi comme début (mercredi → lundi)", () => {
    // Mercredi 5 août 2026
    const start = startOfWeekUTC(new Date("2026-08-05T15:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-08-03T00:00:00.000Z");
  });

  it("traite le dimanche comme fin de semaine précédente → lundi", () => {
    const start = startOfWeekUTC(new Date("2026-08-09T12:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-08-03T00:00:00.000Z");
  });

  it("endOfWeekUTC est le lundi suivant", () => {
    const end = endOfWeekUTC(new Date("2026-08-05T00:00:00.000Z"));
    expect(end.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });
});

describe("habitWeekScore", () => {
  it("plafonne au target", () => {
    expect(habitWeekScore(5, 3)).toEqual({ done: 3, total: 3, met: true });
    expect(habitWeekScore(1, 3)).toEqual({ done: 1, total: 3, met: false });
  });
});

describe("habitsWeekProgress", () => {
  it("agrège plusieurs quotas", () => {
    expect(
      habitsWeekProgress([
        { weekCount: 2, target: 3 },
        { weekCount: 10, target: 10 },
        { weekCount: 0, target: 1 },
      ])
    ).toEqual({ done: 12, total: 14 });
  });
});

describe("decomposeDiscipline", () => {
  it("propose repas + joker + alcool + jogging pour un objectif poids", () => {
    const plan = decomposeDiscipline("atteindre 80kg");
    expect(plan.habits.some((h) => /léger/i.test(h.title) && h.kind === "WEEKLY")).toBe(
      true
    );
    expect(plan.habits.some((h) => /joker/i.test(h.title))).toBe(true);
    expect(plan.habits.some((h) => /alcool/i.test(h.title) && h.kind === "DAILY")).toBe(
      true
    );
    expect(plan.habits.some((h) => /jogging/i.test(h.title) && h.target === 3)).toBe(
      true
    );
  });
});

describe("isDisciplineIntent", () => {
  it("détecte les objectifs long terme", () => {
    expect(isDisciplineIntent("je veux atteindre 80kg")).toBe(true);
    expect(isDisciplineIntent("écrire un roman")).toBe(false);
  });
});
