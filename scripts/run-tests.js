#!/usr/bin/env node
/**
 * Run Playwright tests from a chosen folder on a chosen platform.
 *
 * Examples:
 *   npm run test:run -- smoke-only ios
 *   npm run test:run -- smoke ios --headed
 *   npm run test:run -- sign-up
 *   npm run test:run -- authenticated firefox
 *   npm run test:run -- smoke desktop
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const PLATFORMS = {
  chromium: ['chromium'],
  firefox: ['firefox'],
  webkit: ['webkit'],
  iphone: ['iphone'],
  ios: ['iphone'],
  android: ['android'],
  desktop: ['chromium', 'firefox', 'webkit'],
  mobile: ['iphone', 'android'],
  all: ['chromium', 'firefox', 'webkit', 'iphone', 'android'],
};

const FOLDERS = {
  'smoke-only': {
    dir: 'tests/smoke',
    file: 'smoke.spec.ts',
    projects(platforms) {
      return platforms.map((p) => `smoke-${p}`);
    },
  },
  smoke: {
    dir: 'tests/smoke',
    projects(platforms) {
      return platforms.flatMap((p) => [`smoke-${p}`, p]);
    },
  },
  authenticated: {
    dir: 'tests/smoke',
    file: 'authenticated.spec.ts',
    projects(platforms) {
      return platforms;
    },
  },
  'sign-up': {
    dir: 'tests/sign-up',
    projects() {
      return ['sign-up'];
    },
    ignoresPlatform: true,
  },
  auth: {
    dir: 'tests/auth',
    projects() {
      return ['vercel-auth'];
    },
    ignoresPlatform: true,
  },
};

function printHelp() {
  console.log(`
Usage: npm run test:run -- <folder> [platform] [Playwright options]

Folders:
  smoke-only     tests/smoke/smoke.spec.ts
  smoke          tests/smoke/ — smoke + when logged in
  authenticated  tests/smoke/authenticated.spec.ts
  sign-up        tests/sign-up/ (Chromium only, persistent browser)
  auth           tests/auth/ — Vercel login setup

Platforms (default: all):
  chromium, firefox, webkit, iphone, ios, android, desktop, mobile, all

Options:
  --headed, --ui, --debug, --workers=N  — passed through to Playwright

Examples:
  npm run test:run -- smoke-only ios
  npm run test:run -- smoke ios --headed
  npm run test:run -- authenticated webkit
  npm run test:run -- sign-up
`);
}

function parseArgs(argv) {
  const positional = [];
  const playwrightArgs = [];

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }
    if (arg === '--') {
      continue;
    }
    if (arg.startsWith('-')) {
      playwrightArgs.push(arg);
      continue;
    }
    positional.push(arg);
  }

  return {
    folder: positional[0],
    platform: positional[1] ?? 'all',
    playwrightArgs,
  };
}

function resolveProjects(folderKey, platformKey) {
  const folder = FOLDERS[folderKey];
  if (!folder) {
    throw new Error(`Unknown folder "${folderKey}". Available: ${Object.keys(FOLDERS).join(', ')}`);
  }

  if (folder.ignoresPlatform) {
    if (platformKey !== 'all') {
      console.log(`→ Folder "${folderKey}" ignores platform "${platformKey}" (project ${folder.projects()[0]}).`);
    }
    return { folder, platforms: [], projects: folder.projects([]) };
  }

  const platforms = PLATFORMS[platformKey];
  if (!platforms) {
    throw new Error(`Unknown platform "${platformKey}". Available: ${Object.keys(PLATFORMS).join(', ')}`);
  }

  return {
    folder,
    platforms,
    projects: folder.projects(platforms),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.folder) {
    printHelp();
    process.exit(1);
  }

  let resolved;
  try {
    resolved = resolveProjects(args.folder, args.platform);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  const { folder, platforms, projects } = resolved;
  const testPath = folder.file ? path.join(folder.dir, folder.file) : folder.dir;

  const playwrightCmd = [
    'playwright',
    'test',
    testPath,
    ...projects.flatMap((name) => ['--project', name]),
    ...args.playwrightArgs,
  ];

  if (args.folder === 'sign-up' && args.playwrightArgs.includes('--headed')) {
    const hasWorkers = args.playwrightArgs.some((a) => a.startsWith('--workers'));
    if (!hasWorkers) {
      playwrightCmd.push('--workers=1');
    }
  }

  console.log(`→ Folder: ${args.folder} (${testPath})`);
  if (platforms.length) {
    console.log(`→ Platforms: ${platforms.join(', ')}`);
  }
  console.log(`→ Projects: ${projects.join(', ')}`);
  console.log(`→ npx ${playwrightCmd.join(' ')}\n`);

  const result = spawnSync('npx', playwrightCmd, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  process.exit(result.status ?? 1);
}

main();
