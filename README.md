# idea-e2e

Example Playwright end-to-end tests for the **IDEA** app on a protected Vercel preview.

This repo is a **public, anonymized showcase** of a human + AI collaboration on a real E2E project. See [COLLABORATION.md](./COLLABORATION.md) for how it was built. Product names, preview URLs, and credentials are placeholders here — put real values only in local `.env`.

## Two levels of authentication

| Variables | Purpose |
|-----------|---------|
| `DEPLOYMENT_AUTH_USER` / `DEPLOYMENT_AUTH_PASSWORD` | **Vercel** — vercel.com account, preview access |
| `TEST_USER` / `TEST_PASSWORD` | **IDEA app** — separate app account (not used for Vercel) |

The preview requires a **Vercel account with project access**. A bypass token is **not required**.

**Vercel login is one-time per `BASE_URL`** — the session is saved in `playwright/.auth/vercel-<host>.json`. Changing the preview URL requires logging in again.

## Setup

```bash
cp .env.example .env
```

Fill in `.env`:

```env
BASE_URL=https://your-app-preview.vercel.app
DEPLOYMENT_AUTH_USER=your@email.com
DEPLOYMENT_AUTH_PASSWORD=your_vercel_password
```

If the app has a separate account for authenticated tests:

```env
TEST_USER=...
TEST_PASSWORD=...
APP_WELCOME_TEXT=Welcome to IDEA
APP_HOME_TITLE=IDEA - Example application
```

Adjust `APP_WELCOME_TEXT`, `APP_HOME_TITLE`, `PAYWALL_HEADING`, and `PROFILE_MENU_PATTERN` to match your app’s sign-up modal, home page, paywall, and profile menu.

## Running tests

```bash
# 1. Save Vercel session (on first run or when expired)
npm run auth:vercel

# 2. Automated tests (excluding sign-up)
npm run test:smoke      # smoke: desktop + iPhone + Android
npm test                # smoke + authenticated on all platforms
npm run test:desktop    # desktop only (Chromium, Firefox, Safari)
npm run test:mobile     # mobile only (iPhone 14, Pixel 7)

# 3. Sign-up tests — one Chromium browser for the whole session
npm run test:sign-up:headed

# 4. All tests (sign-up, then smoke + authenticated)
npm run test:all:headed
```

Tests in `tests/sign-up/` and Vercel login in `tests/auth/` **do not run** via `npm test`.

### When Vercel sends an email code (OTP)

```bash
npm run auth:vercel:manual
npm run test:sign-up:headed
```

Complete login in the browser, then **Resume** in Playwright Inspector.

## Commands

| Command | Description |
|---------|-------------|
| `npm run auth:vercel` | Automatic Vercel login → save session |
| `npm run auth:vercel:manual` | Manual login (OTP) |
| `npm run test:smoke` | Smoke on desktop + iPhone + Android |
| `npm test` | Smoke + authenticated on all platforms |
| `npm run test:sign-up:headed` | Sign-up with visible browser |
| `npm run test:run` | Run tests by folder and platform |
| `npm run test:ui` | Playwright GUI |

## Structure

```
src/pages/auth.page.ts     # Page object — modals, sign-up, legal links
tests/smoke/               # smoke + authenticated (automated, multi-platform)
tests/sign-up/             # sign up, sign out, sign in (persistent browser)
tests/auth/                # Vercel login setup
tests/auth.setup.ts        # IDEA app login — skipped without TEST_USER
```

Open the **`idea`** folder in your editor (File → Open Folder), not a parent directory.
