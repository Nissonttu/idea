import type { Page } from '@playwright/test';
import { config } from './config';
import { AuthPage } from './pages/auth.page';

/** Log in to the IDEA app (after passing Vercel protection). */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!config.testUser || !config.testPassword) {
    throw new Error(
      'Set TEST_USER and TEST_PASSWORD in .env (app login), or skip authenticated tests.',
    );
  }

  const auth = new AuthPage(page);
  await auth.ensureLoggedIn(config.testUser, config.testPassword);
}
