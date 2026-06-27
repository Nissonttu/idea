import { test, expect } from './fixtures';
import { AuthPage } from '../../src/pages/auth.page';
import { uniqueSignupEmail } from '../../src/helpers/test-email';
import { config } from '../../src/config';

test.describe.configure({ mode: 'serial' });

test.describe('01 auth — sign up', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.closeAuthModalIfOpen();
    await auth.openEmailSignUpForm();
  });

  test('Sign up form — email and consent checkboxes are available', async ({ page }) => {
    const auth = new AuthPage(page);

    await expect(auth.emailField()).toBeVisible();
    await expect(auth.ageConsentCheckbox()).toBeVisible();
    await expect(auth.termsConsentCheckbox()).toBeVisible();
    await expect(auth.termsOfServiceLink()).toBeVisible();
    await expect(auth.privacyPolicyLink()).toBeVisible();
  });

  test('Terms of service and Privacy policy open in new tabs', async ({ page, context }) => {
    const auth = new AuthPage(page);

    await auth.expectLinkOpensInNewTab(
      auth.termsOfServiceLink(),
      context,
      config.termsOfServiceTitle,
    );
    await auth.expectLinkOpensInNewTab(
      auth.privacyPolicyLink(),
      context,
      config.privacyPolicyTitle,
    );
  });

  test('Confirm email validation works', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.expectEmailValidationTriggered();
  });

  test('Confirm validation errors appear under text fields', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.emailField().fill('a@b.co');
    await auth.passwordField().fill('1');
    await auth.passwordField().blur();
    await auth.expectValidationErrorsVisible();
  });

  test('Complete email sign-up', async ({ page }) => {
    const auth = new AuthPage(page);
    const email = uniqueSignupEmail();
    const password = config.testPassword || 'TestPassword123!';

    await auth.fillSignUpForm(email, password);
    await auth.acceptRequiredConsents();
    await auth.submitSignUp();

    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(page).not.toHaveURL(/signup/i);
  });

  test('Confirm user sees subscription/paywall options after sign-up', async ({
    page,
  }) => {
    test.slow();

    const auth = new AuthPage(page);
    const email = uniqueSignupEmail();
    const password = config.testPassword || 'TestPassword123!';

    await auth.fillSignUpForm(email, password);
    await auth.acceptRequiredConsents();
    await auth.submitSignUp();

    await auth.expectPaywallOrSubscription();
    await auth.dismissSubscriptionModalIfOpen();
  });
});
