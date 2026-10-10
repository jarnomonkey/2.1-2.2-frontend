import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test('student kan het leesprofiel invullen en opslaan', async ({ page }) => {
  await loginAsTestUser(page);
  await page.goto('/aanbevelingen');

  await expect(page.getByRole('heading', { name: 'Mijn leesprofiel' })).toBeVisible();
  const editButton = page.getByRole('button', { name: 'Wijzigen' });
  if (await editButton.count()) {
    await editButton.click();
  }

  const levelGroup = page.getByRole('group', { name: /Wat is je taalniveau/i });
  const topicGroup = page.getByRole('group', { name: /Over welk thema wil je lezen/i });
  await expect(levelGroup).toBeVisible();
  await expect(topicGroup).toBeVisible();

  await levelGroup.locator('button[aria-pressed="false"]').first().click();
  await topicGroup.locator('button[aria-pressed="false"]').first().click();
  await page.getByRole('button', { name: 'Wijzigingen bevestigen' }).click();

  await expect(page.getByText('Je opgeslagen leesprofiel is ingeklapt.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aanbevelingen' })).toBeVisible();
});