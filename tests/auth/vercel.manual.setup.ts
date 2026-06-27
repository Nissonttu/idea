import { test as setup } from '@playwright/test';
import {
  ensureVercelAccess,
  launchPersistentBrowser,
  saveVercelSession,
} from '../../src/persistent-browser';

/**
 * One-time manual login (OTP). Leaves the browser open.
 * Run: npm run auth:vercel:manual
 */
setup('manual Vercel login @manual', async () => {
  const context = await launchPersistentBrowser();
  const page = context.pages()[0] ?? (await context.newPage());

  await ensureVercelAccess(page);
  saveVercelSession(context);

  console.log(
    '\n→ Session saved. Browser stays open.\n→ Run tests: npm run test:sign-up:headed\n',
  );
});
