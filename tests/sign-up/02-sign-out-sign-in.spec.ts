import { test, expect } from './fixtures';
import { AuthPage } from '../../src/pages/auth.page';
import { config } from '../../src/config';

test.describe.configure({ mode: 'serial' });

test.describe('sign up — sign out & sign in', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!config.testUser || !config.testPassword, 'Set TEST_USER and TEST_PASSWORD in .env');

    const auth = new AuthPage(page);
    await auth.closeAuthModalIfOpen();
    await auth.dismissSubscriptionModalIfOpen();
    await auth.ensureLoggedOut();
  });

  test('Sign out', async ({ page }) => {
    test.slow();

    const auth = new AuthPage(page);
    await auth.ensureLoggedIn(config.testUser, config.testPassword!);

    await auth.openProfileMenu();
    const logout = auth.logOutButton();
    await expect(logout).toBeVisible({ timeout: 15_000 });
    await logout.click();

    await expect(
      page.getByRole('button', { name: new RegExp(config.loginEntryButtonName, 'i') }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Sign back in', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.ensureLoggedIn(config.testUser, config.testPassword!);
    await expect(page).not.toHaveURL(/login|sign-in|signin/i);
  });
});
