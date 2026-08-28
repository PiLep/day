import { test, expect } from "@playwright/test";

test.describe("Landing", () => {
  test("affiche la marque, la promesse et le bouton Google", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /Un objectif\.\s*Des tâches\.\s*Aujourd'hui\./,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/ })
    ).toBeVisible();
  });

  test("présente la boucle en trois temps", async ({ page }) => {
    await page.goto("/");
    for (const step of [
      "Posez un objectif",
      "Découpez en tâches",
      "Ouvrez Aujourd’hui",
    ]) {
      await expect(page.getByRole("heading", { name: step })).toBeVisible();
    }
  });

  test("annonce la gratuité et Google Calendar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Gratuit · Google Calendar")).toBeVisible();
  });
});

test.describe("Espace connecté protégé", () => {
  for (const path of ["/app", "/app/goals", "/app/todos", "/app/calendar"]) {
    test(`redirige ${path} vers la landing sans session`, async ({ page }) => {
      await page.goto(path);
      // /app/todos et /app/calendar redirigent d'abord vers /app, puis la session manque.
      await expect(page).toHaveURL("/");
      await expect(
        page.getByRole("button", { name: /Continuer avec Google/ })
      ).toBeVisible();
    });
  }
});

test.describe("Navigation simplifiée", () => {
  test("la landing ne promet plus un calendrier in-app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Posez un objectif" })).toBeVisible();
    await expect(page.getByText(/Google Calendar/i).first()).toBeVisible();
  });
});
