import { expect, type Page } from '@playwright/test';

export const testEmail = process.env.TEST_USER_EMAIL ?? 'student@test.nl';
export const testPassword = process.env.TEST_USER_PASSWORD ?? 'Test1234!';
export const apiUrl = process.env.TEST_API_URL ?? 'http://localhost:3000';

export async function loginThroughUi(page: Page) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();
  await page.getByLabel('E-mailadres').fill(testEmail);
  await page.getByLabel('Wachtwoord').fill(testPassword);
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAsTestUser(page: Page) {
  const response = await page.request.post(`${apiUrl}/auth/login`, {
    data: { email: testEmail, password: testPassword }
  });
  expect(response.ok()).toBeTruthy();

  const { access_token: accessToken } = await response.json();
  await page.addInitScript((token) => {
    localStorage.setItem('access_token', token);
  }, accessToken);
}