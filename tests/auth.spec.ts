import { test, expect } from '@playwright/test';
import { apiUrl, testEmail, testPassword } from './helpers';

test('student kan inloggen', async ({ request }) => {
  const response = await request.post(`${apiUrl}/auth/login`, {
    data: { email: testEmail, password: testPassword }
  });

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toHaveProperty('access_token');
});

test('foute inlog wordt geweigerd', async ({ request }) => {
  const response = await request.post(`${apiUrl}/auth/login`, {
    data: { email: testEmail, password: 'fout-wachtwoord' }
  });

  expect(response.status()).toBe(401);
});

test('beveiligde pagina stuurt een bezoeker zonder login naar inloggen', async ({ page }) => {
  await page.goto('/profiel');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();
});

test('docentpagina stuurt een bezoeker zonder login naar inloggen', async ({ page }) => {
  await page.goto('/mijnstudenten');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();
});