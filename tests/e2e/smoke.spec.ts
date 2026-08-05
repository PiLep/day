import { test, expect } from "@playwright/test";

test.describe("Landing", () => {
  test("affiche le titre et le bouton de connexion Google", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Vos objectifs,\s*un jour à la fois\./ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/ })
    ).toBeVisible();
  });

  test("présente les trois piliers", async ({ page }) => {
    await page.goto("/");
    for (const pillar of ["Découpez", "Planifiez", "Avancez"]) {
      await expect(page.getByText(pillar, { exact: true })).toBeVisible();
    }
  });

  test("annonce la gratuité et la synchro Google Calendar", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Gratuit · Synchronisé avec Google Calendar")
    ).toBeVisible();
  });
});

test.describe("Espace connecté protégé", () => {
  for (const path of ["/app", "/app/goals", "/app/todos", "/app/calendar"]) {
    test(`redirige ${path} vers la landing sans session`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL("/");
      await expect(
        page.getByRole("button", { name: /Continuer avec Google/ })
      ).toBeVisible();
    });
  }
});
