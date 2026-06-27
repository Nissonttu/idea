import { test, expect } from '@playwright/test';

test.describe('IDEA — smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveTitle(/Authentication Required/i);
    await expect(page).not.toHaveURL(/vercel\.com\/login/);
  });
});
