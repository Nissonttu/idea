import { config } from '../config';

/** Unique email address for sign-up tests. */
export function uniqueSignupEmail(): string {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e.${stamp}.${rand}@${config.signupEmailDomain}`;
}
