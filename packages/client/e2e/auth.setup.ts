import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-post').fill(process.env.E2E_EMAIL ?? 'test@birdlog.test');
  await page.getByLabel('Lösenord').fill(process.env.E2E_PASSWORD ?? 'test-password');
  await page.getByRole('button', { name: 'Logga in' }).click();
  await page.waitForURL('/');
  await page.context().storageState({ path: authFile });
});
