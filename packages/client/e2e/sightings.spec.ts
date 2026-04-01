import { test, expect } from '@playwright/test';

test.describe('Sightings list', () => {
  test('renders the sightings list page', async ({ page }) => {
    await page.goto('/sightings');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigates to new sighting form', async ({ page }) => {
    await page.goto('/sightings');
    await page.getByRole('link', { name: /ny observation/i }).click();
    await expect(page).toHaveURL('/new');
  });
});
