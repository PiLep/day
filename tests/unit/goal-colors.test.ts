import { describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL_COLOR,
  GOAL_COLORS,
  goalTrio,
  NO_GOAL_TRIO,
  normalizeGoalColor,
} from "@/lib/goal-colors";

describe("GOAL_COLORS", () => {
  it("expose les 6 couleurs du design system", () => {
    expect(GOAL_COLORS).toHaveLength(6);
    expect(GOAL_COLORS.map((c) => c.base)).toEqual([
      "#6366f1",
      "#0ea5e9",
      "#10b981",
      "#f59e0b",
      "#f43f5e",
      "#8b5cf6",
    ]);
  });

  it("exclut le rouge vif : l'ambre porte le retard", () => {
    expect(GOAL_COLORS.map((c) => c.base)).not.toContain("#ef4444");
  });
});

describe("goalTrio", () => {
  it("renvoie les teintes exactes des couleurs de la palette", () => {
    expect(goalTrio("#8b5cf6")).toEqual({
      base: "#8b5cf6",
      soft: "#ede9fe",
      deep: "#6d28d9",
    });
  });

  it("tolère la casse et les espaces", () => {
    expect(goalTrio("  #10B981 ").soft).toBe("#d1fae5");
  });

  it("retombe sur le neutre sans objectif", () => {
    expect(goalTrio(null)).toEqual(NO_GOAL_TRIO);
    expect(goalTrio(undefined)).toEqual(NO_GOAL_TRIO);
  });

  it("dérive un trio lisible pour une couleur héritée hors palette", () => {
    const trio = goalTrio("#06b6d4");
    expect(trio.base).toBe("#06b6d4");
    expect(trio.soft).toContain("color-mix");
    expect(trio.deep).toContain("color-mix");
  });
});

describe("normalizeGoalColor", () => {
  it("garde une couleur de la palette", () => {
    expect(normalizeGoalColor("#f43f5e")).toBe("#f43f5e");
  });

  it("ramène toute autre valeur sur la couleur par défaut", () => {
    expect(normalizeGoalColor("#ef4444")).toBe(DEFAULT_GOAL_COLOR);
    expect(normalizeGoalColor("rouge")).toBe(DEFAULT_GOAL_COLOR);
    expect(normalizeGoalColor(null)).toBe(DEFAULT_GOAL_COLOR);
    expect(normalizeGoalColor(undefined)).toBe(DEFAULT_GOAL_COLOR);
  });
});
