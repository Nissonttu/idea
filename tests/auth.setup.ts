import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config';
import { loginAsTestUser } from '../src/login';

setup('log in to IDEA app', async ({ page }) => {
  setup.skip(
    !config.testUser || !config.testPassword,
    'Missing TEST_USER / TEST_PASSWORD — skipping app login.',
  );

  await loginAsTestUser(page);

  fs.mkdirSync(path.dirname(config.authStoragePath), { recursive: true });
  await page.context().storageState({ path: config.authStoragePath });
});
