import { test, expect } from '@playwright/test';
import { apiUrl } from './helpers';

test('boekdetails toont het geselecteerde boek', async ({ page, request }) => {
  const response = await request.get(`${apiUrl}/books`);
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  const books = Array.isArray(data) ? data : data.books ?? [];
  expect(books.length).toBeGreaterThan(0);

  const book = books[0];
  await page.goto(`/boeken/${book._id}`);

  await expect(page.getByRole('heading', { name: book.title })).toBeVisible();
});
