import { describe, expect, it } from "vitest";
import {
  parseDateInput,
  toDateString,
  addDaysUTC,
  diffInDaysUTC,
  taskDateLabel,
  isLate,
  goalDueLabel,
  goalDueLabelFull,
  dayHeading,
  monthHeading,
  timeAgoLabel,
} from "@/lib/dates";

/** Mercredi 5 août 2026 — le « aujourd'hui » des maquettes. */
const TODAY = new Date("2026-08-05T09:41:00.000Z");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
/** ICU insère des espaces insécables en français : on compare sans. */
const plain = (s: string) => s.replace(/[  ]/g, " ");

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

describe("diffInDaysUTC", () => {
  it("compare des jours, pas des instants", () => {
    expect(diffInDaysUTC(TODAY, day("2026-08-05"))).toBe(0);
    expect(diffInDaysUTC(TODAY, day("2026-08-06"))).toBe(1);
    expect(diffInDaysUTC(TODAY, day("2026-08-04"))).toBe(-1);
  });

  it("traverse les mois", () => {
    expect(diffInDaysUTC(day("2026-08-31"), day("2026-09-01"))).toBe(1);
  });
});

describe("taskDateLabel", () => {
  it("nomme les trois jours proches", () => {
    expect(taskDateLabel(day("2026-08-05"), TODAY)).toBe("aujourd'hui");
    expect(taskDateLabel(day("2026-08-04"), TODAY)).toBe("hier");
    expect(taskDateLabel(day("2026-08-06"), TODAY)).toBe("demain");
  });

  it("donne le jour de la semaine à moins d'une semaine", () => {
    expect(taskDateLabel(day("2026-08-03"), TODAY)).toBe("lun. 3 août");
    expect(taskDateLabel(day("2026-08-08"), TODAY)).toBe("sam. 8 août");
  });

  it("passe au jour et mois au-delà d'une semaine", () => {
    expect(taskDateLabel(day("2026-09-30"), TODAY)).toBe("30 sept.");
  });

  it("ajoute l'année quand elle change", () => {
    expect(taskDateLabel(day("2027-01-12"), TODAY)).toBe("12 janv. 2027");
  });
});

describe("isLate", () => {
  it("ne considère en retard que le passé daté", () => {
    expect(isLate(day("2026-08-04"), TODAY)).toBe(true);
    expect(isLate(day("2026-08-05"), TODAY)).toBe(false);
    expect(isLate(day("2026-08-06"), TODAY)).toBe(false);
    expect(isLate(null, TODAY)).toBe(false);
  });
});

describe("goalDueLabel", () => {
  it("omet l'année de l'année courante", () => {
    expect(goalDueLabel(day("2026-09-30"), TODAY)).toBe("30 sept.");
  });

  it("affiche l'année si elle diffère", () => {
    expect(goalDueLabel(day("2027-03-01"), TODAY)).toBe("1 mars 2027");
  });

  it("garde toujours l'année dans la version complète", () => {
    expect(goalDueLabelFull(day("2026-09-30"))).toBe("30 sept. 2026");
  });
});

describe("dayHeading / monthHeading", () => {
  it("capitalise la première lettre", () => {
    expect(dayHeading(day("2026-08-05"))).toBe("Mercredi 5 août");
    expect(monthHeading(day("2026-08-01"))).toBe("Août 2026");
  });
});

describe("timeAgoLabel", () => {
  it("choisit l'unité la plus lisible", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    expect(plain(timeAgoLabel(new Date("2026-08-05T11:58:00.000Z"), now))).toBe(
      "il y a 2 min"
    );
    expect(plain(timeAgoLabel(new Date("2026-08-05T09:00:00.000Z"), now))).toBe(
      "il y a 3 h"
    );
  });

  it("reste vague sous la minute", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    expect(timeAgoLabel(new Date("2026-08-05T11:59:30.000Z"), now)).toBe(
      "à l'instant"
    );
  });
});
