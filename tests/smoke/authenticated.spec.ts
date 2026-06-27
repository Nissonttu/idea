import { test, expect } from '@playwright/test';
import { config } from '../../src/config';

test.describe('IDEA — when logged in', () => {
  test('user can access the app', async ({ page }) => {
    await page.goto('/');
    const titlePattern = config.appHomeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page).toHaveTitle(new RegExp(titlePattern, 'i'));
  });
});
