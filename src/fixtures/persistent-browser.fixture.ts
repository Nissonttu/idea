import { test as base, expect } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import {
  ensureVercelAccess,
  launchPersistentBrowser,
  saveVercelSession,
} from '../persistent-browser';

type WorkerFixtures = {
  sharedContext: BrowserContext;
};

export const test = base.extend<{}, WorkerFixtures>({
  sharedContext: [
    async ({}, use) => {
      const context = await launchPersistentBrowser();
      const page = context.pages()[0] ?? (await context.newPage());

      await ensureVercelAccess(page);
      saveVercelSession(context);

      await use(context);

      if (process.env.KEEP_BROWSER_OPEN !== '1') {
        await context.close();
      } else {
        console.log('\n→ KEEP_BROWSER_OPEN=1 — browser stays open.\n');
      }
    },
    { scope: 'worker' },
  ],

  page: async ({ sharedContext }, use) => {
    const page = sharedContext.pages()[0] ?? (await sharedContext.newPage());
    await use(page);
  },

  context: async ({ sharedContext }, use) => {
    await use(sharedContext);
  },
});

export { expect };
