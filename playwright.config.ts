import { defineConfig, devices, type Project } from '@playwright/test';
import fs from 'node:fs';
import { config } from './src/config';

const vercelAuthExists = fs.existsSync(config.vercelAuthStoragePath);
const vercelStorageState = vercelAuthExists
  ? { storageState: config.vercelAuthStoragePath }
  : {};

type DeviceName = keyof typeof devices;

/** Platforms for automated tests (smoke + authenticated). */
const platforms: ReadonlyArray<{ name: string; device: DeviceName }> = [
  // Desktop
  { name: 'chromium', device: 'Desktop Chrome' },
  { name: 'firefox', device: 'Desktop Firefox' },
  { name: 'webkit', device: 'Desktop Safari' },
  // Mobile — iOS (WebKit) and Android (Chromium) emulation
  { name: 'iphone', device: 'iPhone 14' },
  { name: 'android', device: 'Pixel 7' },
];

function platformProjects(): Project[] {
  return platforms.flatMap(({ name, device }) => [
    {
      name: `smoke-${name}`,
      testMatch: /smoke\/smoke\.spec\.ts/,
      dependencies: ['vercel-auth'],
      use: {
        ...devices[device],
        ...vercelStorageState,
      },
    },
    {
      name,
      testMatch: /smoke\/authenticated\.spec\.ts/,
      dependencies: ['vercel-auth', 'setup'],
      use: {
        ...devices[device],
        storageState: config.authStoragePath,
      },
    },
  ]);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: config.baseURL,
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'vercel-auth',
      testMatch: /auth\/vercel\.setup\.ts/,
    },
    {
      name: 'vercel-auth-manual',
      testMatch: /auth\/vercel\.manual\.setup\.ts/,
    },
    {
      name: 'setup',
      testMatch: 'auth.setup.ts',
      dependencies: ['vercel-auth'],
      timeout: 60_000,
      use: {
        ...devices['Desktop Chrome'],
        ...vercelStorageState,
      },
    },
    ...platformProjects(),
    {
      name: 'sign-up',
      testMatch: /sign-up\/.*\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      timeout: 120_000,
    },
  ],
});
