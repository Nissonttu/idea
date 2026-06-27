import path from 'node:path';
import dotenv from 'dotenv';
import { sanitizeHostname } from './vercel-session';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing ${name} in .env (copy from .env.example and fill in).`,
    );
  }
  return value.trim();
}

const baseURL = required(
  'BASE_URL',
  process.env.BASE_URL ?? 'https://your-app-preview.vercel.app',
).replace(/\/$/, '');

const appHostname = new URL(baseURL).hostname;
const hostKey = sanitizeHostname(appHostname);

export const config = {
  baseURL,
  appHostname,
  vercelBypass: process.env.VERCEL_PROTECTION_BYPASS?.trim() || undefined,
  deploymentAuthUser: process.env.DEPLOYMENT_AUTH_USER?.trim() || '',
  deploymentAuthPassword: process.env.DEPLOYMENT_AUTH_PASSWORD?.trim() || '',
  testUser: process.env.TEST_USER?.trim() || '',
  testPassword: process.env.TEST_PASSWORD?.trim() || '',
  appWelcomeText: process.env.APP_WELCOME_TEXT?.trim() || 'Welcome to IDEA',
  appHomeTitle: process.env.APP_HOME_TITLE?.trim() || 'IDEA - Example application',
  /** IDEA: login/sign-up use modals on the home page. */
  signupPath: process.env.SIGNUP_PATH?.trim() || '/',
  loginPath: process.env.LOGIN_PATH?.trim() || '/',
  resetPasswordPath: process.env.RESET_PASSWORD_PATH?.trim() || '/',
  loginEmailLabel: process.env.LOGIN_EMAIL_LABEL?.trim() || 'Enter your email',
  loginPasswordLabel: process.env.LOGIN_PASSWORD_LABEL?.trim() || 'Enter password',
  loginEntryButtonName: process.env.LOGIN_ENTRY_BUTTON_NAME?.trim() || 'Log in',
  loginButtonName: process.env.LOGIN_BUTTON_NAME?.trim() || 'Continue',
  signupEntryButtonName: process.env.SIGNUP_ENTRY_BUTTON_NAME?.trim() || 'Get started',
  signupEmailLabel: process.env.SIGNUP_EMAIL_LABEL?.trim() || 'Enter your email',
  signupPasswordLabel: process.env.SIGNUP_PASSWORD_LABEL?.trim() || 'Enter password',
  signupSubmitName: process.env.SIGNUP_SUBMIT_NAME?.trim() || 'Continue',
  ageConsentLabel: process.env.AGE_CONSENT_LABEL?.trim() || 'at least 18',
  termsConsentLabel: process.env.TERMS_CONSENT_LABEL?.trim() || 'I agree to the Terms',
  termsLinkName: process.env.TERMS_LINK_NAME?.trim() || 'Terms',
  termsOfServiceLinkName:
    process.env.TERMS_OF_SERVICE_LINK_NAME?.trim() || 'Terms of Service',
  privacyPolicyLinkName: process.env.PRIVACY_POLICY_LINK_NAME?.trim() || 'Privacy policy',
  termsOfServiceTitle: process.env.TERMS_OF_SERVICE_TITLE?.trim() || 'Terms of Service',
  privacyPolicyTitle: process.env.PRIVACY_POLICY_TITLE?.trim() || 'Privacy policy',
  paywallHeading:
    process.env.PAYWALL_HEADING?.trim() ||
    'subscription|paywall|plan|premium|choose a plan',
  profileMenuPattern:
    process.env.PROFILE_MENU_PATTERN?.trim() || String.raw`^😇$|^🤠$|^👤$`,
  signupEmailDomain: process.env.SIGNUP_EMAIL_DOMAIN?.trim() || 'example.com',
  vercelAuthStoragePath: path.resolve(
    __dirname,
    '..',
    'playwright',
    '.auth',
    `vercel-${hostKey}.json`,
  ),
  browserProfileDir: path.resolve(
    __dirname,
    '..',
    'playwright',
    '.browser-profile',
    hostKey,
  ),
  authStoragePath: path.resolve(__dirname, '..', 'playwright', '.auth', 'user.json'),
};
