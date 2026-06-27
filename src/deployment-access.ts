import type { Page } from '@playwright/test';
import { config } from './config';
import { hasStoredVercelSession } from './vercel-session';

function deploymentCredentials(): { user: string; password: string } {
  const user = config.deploymentAuthUser;
  const password = config.deploymentAuthPassword;
  if (!user || !password) {
    throw new Error(
      'Set DEPLOYMENT_AUTH_USER and DEPLOYMENT_AUTH_PASSWORD in .env — credentials for the protected Vercel preview (account with project access).',
    );
  }
  return { user, password };
}

async function submitInlineDeploymentPassword(page: Page, password: string): Promise<void> {
  const passwordInput = page.locator(
    'input[type="password"], input[name="password"]',
  );
  await passwordInput.fill(password);
  await page.locator('button[type="submit"], form button').first().click();
}

async function submitVercelSsoLogin(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByRole('button', { name: 'Continue with Email' }).click();

  const passwordField = page
    .locator('input[type="password"]')
    .or(page.getByLabel(/^password$/i))
    .first();

  const hasPassword = await passwordField
    .waitFor({ state: 'visible', timeout: 12_000 })
    .then(() => true)
    .catch(() => false);

  if (!hasPassword) {
    throw new Error(
      'Vercel requested an email code (OTP) instead of a password. ' +
        'Run once: npm run auth:vercel:manual — log in in the browser; the session will be saved to playwright/.auth/vercel.json',
    );
  }

  await passwordField.fill(password);

  const submit = page.getByRole('button', {
    name: /^(log in|sign in|continue)$/i,
  });
  if (await submit.count()) {
    await submit.first().click();
  } else {
    await page.locator('button[type="submit"]').first().click();
  }
}

function isOnAppOrigin(page: Page): boolean {
  const appHost = new URL(config.baseURL).hostname;
  return new URL(page.url()).hostname === appHost;
}

export async function ensureDeploymentAccess(page: Page): Promise<void> {
  if (config.vercelBypass) {
    const url = new URL(config.baseURL);
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true');
    url.searchParams.set('x-vercel-protection-bypass', config.vercelBypass);
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
    if (isOnAppOrigin(page) && !(await isDeploymentGate(page))) return;
  }

  const appHost = new URL(config.baseURL).hostname;

  if (hasStoredVercelSession(config.vercelAuthStoragePath, config.appHostname)) {
    await page.goto(config.baseURL, { waitUntil: 'domcontentloaded' });
    if (isOnAppOrigin(page) && !(await isDeploymentGate(page))) return;
  }

  await page.goto(config.baseURL, { waitUntil: 'domcontentloaded' });

  await page
    .waitForURL(
      (url) => url.hostname === appHost || url.hostname.endsWith('vercel.com'),
      { timeout: 30_000 },
    )
    .catch(() => undefined);

  await page.waitForLoadState('networkidle').catch(() => undefined);

  if (isOnAppOrigin(page) && !(await isDeploymentGate(page))) return;

  const { user, password } = deploymentCredentials();

  if (page.url().includes('vercel.com')) {
    await submitVercelSsoLogin(page, user, password);
  } else if (await isDeploymentGate(page)) {
    await submitInlineDeploymentPassword(page, password);
  }

  await page.waitForURL((url) => url.hostname === appHost, { timeout: 120_000 });

  if (await isDeploymentGate(page)) {
    throw new Error(
      'Deployment protection screen still visible — check DEPLOYMENT_AUTH_* or run npm run auth:vercel:manual',
    );
  }
}

export async function isDeploymentGate(page: Page): Promise<boolean> {
  const title = await page.title();
  if (/authentication required/i.test(title)) return true;
  if (page.url().includes('vercel.com/login')) return true;
  if (page.url().includes('vercel.com/sso-api')) return true;
  return false;
}
