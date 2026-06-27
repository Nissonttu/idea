# How this project was built (human + AI collaboration)

This repository is an **anonymized showcase** of a real Playwright E2E workflow. The product is referred to as **IDEA**; all URLs, credentials, and client-specific copy live only in your local `.env` (never committed).

## What we built together

1. **Test layout** — split smoke, sign-up, and auth setup into clear folders with dedicated Playwright projects (multi-browser automated runs + persistent-browser sign-up flow).

2. **Two-level auth** — Vercel deployment protection (saved session per host) plus optional in-app login for authenticated smoke tests.

3. **Stable sign-up flows** — replaced flaky `networkidle` waits, scoped legal links to the sign-up modal (strict-mode fix), and added new-tab checks for Terms of Service and Privacy policy.

4. **Config-driven UI copy** — welcome text, page titles, paywall matchers, and profile menu patterns come from `.env` so the same tests can target different apps without code changes.

5. **Developer ergonomics** — folder/platform test runner, headed scripts for manual OTP login, and English documentation for the showcase.

## Typical workflow

| Step | Who | Example |
|------|-----|---------|
| Describe the failing test or desired check | Human | “Legal links should open in new tabs with correct titles” |
| Investigate locators, propose fix | AI | Scope links to modal; use partial title match |
| Run tests, iterate | Both | `npm run test:sign-up:headed` |
| Commit focused changes | Human (or AI on request) | One logical change per commit |

## Running against your own app

1. Copy `.env.example` → `.env` and fill in real values.
2. Set `APP_WELCOME_TEXT`, `APP_HOME_TITLE`, `PAYWALL_HEADING`, and `PROFILE_MENU_PATTERN` to match your app’s UI.
3. Run `npm run auth:vercel` once per preview URL.
4. Run `npm test` or `npm run test:sign-up:headed`.

The public repo stays generic; your `.env` and `playwright/.auth/` stay local.
