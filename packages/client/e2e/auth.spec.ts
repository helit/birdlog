import { test, expect } from '@playwright/test';

// Specs visit /login and /register, so they must run logged out. The global
// config authenticates via storageState; override it to an empty state here,
// otherwise an authed session redirects /login and /register to / (App.tsx).
test.use({ storageState: { cookies: [], origins: [] } });

const SEEDED_EMAIL = process.env.E2E_EMAIL ?? 'test@birdlog.test';
const SEEDED_PASSWORD = process.env.E2E_PASSWORD ?? 'test-password';

test.describe('Auth flows', () => {
  test('logs in with seeded credentials and lands on the home page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-post').fill(SEEDED_EMAIL);
    await page.getByLabel('Lösenord').fill(SEEDED_PASSWORD);
    await page.getByRole('button', { name: 'Logga in' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('tab', { name: 'Identifiera' })).toBeVisible();
  });

  test('keeps the user on /login and shows an error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-post').fill(SEEDED_EMAIL);
    await page.getByLabel('Lösenord').fill('definitely-wrong-password');
    await page.getByRole('button', { name: 'Logga in' }).click();

    await expect(page.locator('p.text-destructive')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('registers a new user with a unique email and lands on the home page', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Namn').fill('E2E Test');
    await page.getByLabel('E-post').fill(`e2e-${Date.now()}@birdlog.test`);
    await page.getByLabel('Lösenord').fill('test-password');
    await page.getByRole('button', { name: 'Registrera' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('tab', { name: 'Identifiera' })).toBeVisible();
  });
});
