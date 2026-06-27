import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { config } from './config';
import { isDeploymentGate } from './deployment-access';
import { hasStoredVercelSession } from './vercel-session';

export async function ensureVercelAccess(page: Page): Promise<void> {
  const { appHostname, vercelAuthStoragePath } = config;
  const hadSession = hasStoredVercelSession(vercelAuthStoragePath, appHostname);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForURL(
      (url) =>
        url.hostname === appHostname || url.hostname.endsWith('vercel.com'),
      { timeout: 30_000 },
    )
    .catch(() => undefined);

  if (!(await isDeploymentGate(page))) {
    saveVercelSession(page.context());
    if (hadSession) {
      console.log(`\n→ Vercel session for ${appHostname} still valid — skipping login.\n`);
    }
    return;
  }

  console.log(
    `\n→ Vercel login required for ${appHostname}.\n→ Enter the OTP code in the browser, then Resume in Playwright Inspector.\n`,
  );
  await page.pause();

  await page.waitForURL((url) => url.hostname === appHostname, { timeout: 600_000 });

  if (await isDeploymentGate(page)) {
    throw new Error('Vercel gate still visible — complete login and click Resume.');
  }

  saveVercelSession(page.context());
  console.log(`\n→ Vercel session saved for ${appHostname} — future runs will skip login.\n`);
}

export function saveVercelSession(context: BrowserContext): void {
  fs.mkdirSync(path.dirname(config.vercelAuthStoragePath), { recursive: true });
  context.storageState({ path: config.vercelAuthStoragePath });
}

export async function launchPersistentBrowser(): Promise<BrowserContext> {
  fs.mkdirSync(config.browserProfileDir, { recursive: true });

  return chromium.launchPersistentContext(config.browserProfileDir, {
    headless: false,
    baseURL: config.baseURL,
    viewport: { width: 1280, height: 720 },
  });
}
