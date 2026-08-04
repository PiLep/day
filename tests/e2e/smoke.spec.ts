import { test, expect } from "@playwright/test";

test.describe("Landing", () => {
  test("affiche le titre et le bouton de connexion Google", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Vos objectifs, jour après jour." })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/ })
    ).toBeVisible();
  });

  test("présente les trois fonctionnalités clés", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Objectifs avec suivi de progression")).toBeVisible();
    await expect(page.getByText("Todo list simple et rapide")).toBeVisible();
    await expect(page.getByText("Synchro Google Calendar")).toBeVisible();
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
