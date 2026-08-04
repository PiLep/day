import { describe, expect, it } from "vitest";
import { eventBody } from "@/lib/google-calendar";

describe("eventBody", () => {
  const base = {
    title: "Courir 5 km",
    done: false,
    dueDate: new Date("2026-08-04T00:00:00.000Z"),
  };

  it("crée un événement journée entière avec fin exclusive (convention Google)", () => {
    const body = eventBody({ ...base, goal: null });
    expect(body.start).toEqual({ date: "2026-08-04" });
    expect(body.end).toEqual({ date: "2026-08-05" });
    expect(body.summary).toBe("Courir 5 km");
  });

  it("préfixe ✓ quand la tâche est terminée", () => {
    const body = eventBody({ ...base, done: true, goal: null });
    expect(body.summary).toBe("✓ Courir 5 km");
  });

  it("mentionne l'objectif dans la description", () => {
    const body = eventBody({ ...base, goal: { title: "Semi-marathon" } });
    expect(body.description).toContain("Semi-marathon");
  });

  it("gère le passage de mois en fin exclusive", () => {
    const body = eventBody({
      ...base,
      dueDate: new Date("2026-08-31T00:00:00.000Z"),
      goal: null,
    });
    expect(body.end).toEqual({ date: "2026-09-01" });
  });
});
