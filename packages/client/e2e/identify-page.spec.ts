import { test, expect } from '@playwright/test';

test.describe('Identify page', () => {
  test('renders the main identify page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigates to guided identify flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Guidat ID/i }).click();
    await expect(page).toHaveURL('/identify/guided');
  });

  test('navigates to photo identify flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Foto ID/i }).click();
    await expect(page).toHaveURL('/identify/photo');
  });
});
