import { test, expect } from "@playwright/test";

test.describe("Fågelbok — browse + search flow", () => {
  test("browses Order → Family → Species and opens BirdInfoPage", async ({ page }) => {
    await page.goto("/guidebook");

    await expect(page.getByPlaceholder("Sök art…")).toBeVisible();

    // Tap the Tättingar order row
    await page.getByRole("button", { name: /Tättingar/ }).click();
    await expect(page).toHaveURL(/\/guidebook\/order\/passeriformes/);

    // Tap the Mesar family row
    await page.getByRole("button", { name: /Mesar/ }).click();
    await expect(page).toHaveURL(/\/guidebook\/family\/paridae/);

    // Tap the Talgoxe species row
    await page.getByRole("button", { name: /Talgoxe/ }).click();
    await expect(page).toHaveURL(/\/bird\/Parus%20major/);
  });

  test("accent-insensitive search returns Blåmes for 'blames'", async ({ page }) => {
    await page.goto("/guidebook");
    await page.getByPlaceholder("Sök art…").fill("blames");

    const blames = page.getByRole("button", { name: /Blåmes/ });
    await expect(blames).toBeVisible();

    await blames.click();
    await expect(page).toHaveURL(/\/bird\/Cyanistes%20caeruleus/);
  });

  test("empty-state copy when no species match", async ({ page }) => {
    await page.goto("/guidebook");
    await page.getByPlaceholder("Sök art…").fill("zzzzzzzz");
    await expect(page.getByText("Inga arter matchar din sökning.")).toBeVisible();
  });
});

test.describe("Fågelbok — LifeListDetail link", () => {
  test("LifeListDetail shows 'Mer om arten' button that opens BirdInfoPage", async ({ page }) => {
    await page.goto("/life-list");

    // Tap the first life-list entry if one exists
    const firstRow = page.locator('[data-testid="life-list-card"]').first();
    const count = await firstRow.count();
    test.skip(count === 0, "No life-list entries seeded for this test user");

    await firstRow.click();
    const link = page.getByRole("link", { name: /Mer om arten/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/bird\//);
  });
});
