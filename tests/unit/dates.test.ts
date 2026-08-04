import { describe, expect, it } from "vitest";
import { parseDateInput, toDateString, addDaysUTC } from "@/lib/dates";

describe("parseDateInput", () => {
  it("parse une date valide en minuit UTC", () => {
    const d = parseDateInput("2026-08-04");
    expect(d?.toISOString()).toBe("2026-08-04T00:00:00.000Z");
  });

  it("rejette les formats invalides", () => {
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput("04/08/2026")).toBeNull();
    expect(parseDateInput("2026-8-4")).toBeNull();
    expect(parseDateInput("demain")).toBeNull();
    expect(parseDateInput(null)).toBeNull();
    expect(parseDateInput(undefined)).toBeNull();
    expect(parseDateInput(42)).toBeNull();
  });

  it("rejette les dates impossibles", () => {
    expect(parseDateInput("2026-13-45")).toBeNull();
  });

  it("tolère les espaces autour", () => {
    expect(parseDateInput(" 2026-01-01 ")?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
  });
});

describe("toDateString", () => {
  it("formate en YYYY-MM-DD", () => {
    expect(toDateString(new Date("2026-08-04T15:30:00.000Z"))).toBe("2026-08-04");
  });
});

describe("addDaysUTC", () => {
  it("ajoute des jours sans muter l'original", () => {
    const d = new Date("2026-08-31T00:00:00.000Z");
    const next = addDaysUTC(d, 1);
    expect(toDateString(next)).toBe("2026-09-01");
    expect(toDateString(d)).toBe("2026-08-31");
  });

  it("gère les années bissextiles", () => {
    expect(toDateString(addDaysUTC(new Date("2024-02-28T00:00:00.000Z"), 1))).toBe(
      "2024-02-29"
    );
  });
});
