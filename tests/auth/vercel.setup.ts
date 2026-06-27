import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../src/config';
import { ensureDeploymentAccess } from '../../src/deployment-access';
import { hasStoredVercelSession } from '../../src/vercel-session';

setup('log in to protected Vercel preview @manual', async ({ page }) => {
  setup.skip(
    hasStoredVercelSession(config.vercelAuthStoragePath, config.appHostname),
    `Vercel session valid for ${config.appHostname} — skipping re-login.`,
  );

  await ensureDeploymentAccess(page);

  fs.mkdirSync(path.dirname(config.vercelAuthStoragePath), { recursive: true });
  await page.context().storageState({ path: config.vercelAuthStoragePath });
});
