import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { config } from '../config';

export class AuthPage {
  constructor(readonly page: Page) {}

  private welcomeToAppPattern(): RegExp {
    const escaped = config.appWelcomeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  }

  async gotoHome(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async gotoSignUp(): Promise<void> {
    await this.gotoHome();
  }

  async gotoSignIn(): Promise<void> {
    await this.gotoHome();
  }

  loginModal(): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByText(/welcome back/i) })
      .filter({ has: this.page.locator('input[type="email"]') })
      .last();
  }

  signUpModal(): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByText(this.welcomeToAppPattern()) })
      .filter({ has: this.page.locator('input[type="email"]') })
      .last();
  }

  emailField(): Locator {
    return this.loginModal()
      .locator('input[type="email"]')
      .or(this.signUpModal().locator('input[type="email"]'))
      .or(this.page.getByPlaceholder(new RegExp(config.signupEmailLabel, 'i')))
      .or(this.page.getByLabel(new RegExp(config.signupEmailLabel, 'i')))
      .or(this.page.getByPlaceholder(/email/i))
      .or(this.page.locator('input[type="email"]'))
      .first();
  }

  passwordField(): Locator {
    return this.loginModal()
      .locator('input[type="password"]')
      .or(this.signUpModal().locator('input[type="password"]'))
      .or(this.page.getByPlaceholder(new RegExp(config.signupPasswordLabel, 'i')))
      .or(this.page.getByLabel(new RegExp(config.signupPasswordLabel, 'i')))
      .or(this.page.getByPlaceholder(/password/i))
      .or(this.page.locator('input[type="password"]'))
      .first();
  }

  signUpSubmitButton(): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(config.signupSubmitName, 'i'),
    });
  }

  signInSubmitButton(): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(config.loginButtonName, 'i'),
    });
  }

  ageConsentCheckbox(): Locator {
    return this.page.getByText(new RegExp(config.ageConsentLabel, 'i'));
  }

  termsConsentCheckbox(): Locator {
    return this.page.getByText(new RegExp(config.termsConsentLabel, 'i')).first();
  }

  termsLink(): Locator {
    return this.page
      .locator('label, div, p')
      .filter({ hasText: new RegExp(config.termsConsentLabel, 'i') })
      .getByRole('link', { name: new RegExp(config.termsLinkName, 'i') })
      .first();
  }

  termsOfServiceLink(): Locator {
    return this.signUpModal().getByRole('link', {
      name: new RegExp(config.termsOfServiceLinkName, 'i'),
    });
  }

  privacyPolicyLink(): Locator {
    return this.signUpModal().getByRole('link', {
      name: new RegExp(config.privacyPolicyLinkName, 'i'),
    });
  }

  async expectLinkOpensInNewTab(
    link: Locator,
    context: BrowserContext,
    expectedTitle: string,
  ): Promise<void> {
    await expect(link).toBeVisible();

    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 15_000 }),
      link.click(),
    ]);

    await popup.waitForLoadState('domcontentloaded');
    const titlePattern = expectedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(popup).toHaveTitle(new RegExp(titlePattern, 'i'));
    await popup.close();
  }

  forgotPasswordLink(): Locator {
    return this.page.getByText(/reset password/i);
  }

  loginEntryButton(): Locator {
    return this.page
      .getByRole('button', { name: new RegExp(`^${config.loginEntryButtonName}$`, 'i') })
      .first();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.profileMenuButton().isVisible().catch(() => false);
  }

  signUpSwitchLink(): Locator {
    return this.page.getByText(/^Sign up$/i).last();
  }

  googleButton(): Locator {
    return this.page.getByRole('button', { name: /google/i });
  }

  appleButton(): Locator {
    return this.page.getByRole('button', { name: /apple/i });
  }

  facebookButton(): Locator {
    return this.page.getByRole('button', { name: /facebook/i });
  }

  profileMenuButton(): Locator {
    return this.page.getByText(new RegExp(config.profileMenuPattern)).first();
  }

  logOutButton(): Locator {
    return this.page
      .getByRole('button', { name: /log out|sign out/i })
      .or(this.page.getByRole('link', { name: /log out|sign out/i }))
      .or(this.page.getByText(/^Log out$/i));
  }

  async openProfileMenu(): Promise<void> {
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.locator('body').click({ position: { x: 8, y: 8 }, force: true });

    const menuEntry = this.logOutButton().or(this.page.getByText(/account settings|view profile/i));
    if (await menuEntry.first().isVisible().catch(() => false)) return;

    await this.profileMenuButton().click({ force: true });
    await menuEntry.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  fieldValidationError(): Locator {
    return this.page.getByText(
      /please enter a valid email|invalid email|this field is required|password must be at least|at least 6 characters/i,
    );
  }

  async closeAuthModalIfOpen(): Promise<void> {
    const close = this.page.getByRole('button', { name: /^close$/i });
    if (await close.isVisible().catch(() => false)) {
      await close.click();
      await close.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }
  }

  async dismissSubscriptionModalIfOpen(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const dismiss = this.page
        .getByRole('button', { name: /^Skip$/i })
        .or(this.page.getByRole('button', { name: /not now|maybe later/i }))
        .or(this.page.getByRole('button', { name: /^close$/i }));

      const target = dismiss.first();
      if (!(await target.isVisible().catch(() => false))) break;

      await target.click({ force: true });
      await target.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }
  }

  async ensureLoggedOut(): Promise<void> {
    await this.closeAuthModalIfOpen();
    await this.dismissSubscriptionModalIfOpen();
    await this.gotoHome();
    await this.dismissSubscriptionModalIfOpen();

    for (let attempt = 0; attempt < 2; attempt++) {
      if (await this.loginEntryButton().isVisible().catch(() => false)) break;
      if (!(await this.isLoggedIn().catch(() => false))) break;

      await this.openProfileMenu();
      await this.logOutButton().click({ force: true });
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await this.dismissSubscriptionModalIfOpen();
    }

    await this.loginEntryButton().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Dismiss overlays and ensure the Log in button is visible (without full logout if already logged out). */
  async prepareForAuthEntry(): Promise<void> {
    await this.closeAuthModalIfOpen();
    await this.dismissSubscriptionModalIfOpen();
    await this.gotoHome();
    await this.dismissSubscriptionModalIfOpen();

    if (await this.loginEntryButton().isVisible().catch(() => false)) return;

    await this.ensureLoggedOut();
  }

  async isLoginModalOpen(): Promise<boolean> {
    const welcomeBack = await this.page.getByText(/welcome back/i).isVisible().catch(() => false);
    const password = await this.passwordField().isVisible().catch(() => false);
    return welcomeBack && password;
  }

  async ensureLoggedIn(email: string, password: string): Promise<void> {
    await this.dismissSubscriptionModalIfOpen();
    await this.gotoHome();
    if (await this.isLoggedIn()) return;

    await this.openEmailSignInForm();
    if (await this.isLoggedIn()) return;

    const emailInput = this.loginModal().locator('input[type="email"]');
    const passwordInput = this.loginModal().locator('input[type="password"]');

    await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    await emailInput.fill(email);
    await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    await passwordInput.fill(password);
    await this.loginModal().getByRole('button', { name: new RegExp(config.loginButtonName, 'i') }).click({
      force: true,
    });
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.dismissSubscriptionModalIfOpen();
    await this.profileMenuButton().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async openLoginModal(): Promise<void> {
    await this.prepareForAuthEntry();
    await this.closeAuthModalIfOpen();

    if (await this.isLoginModalOpen()) return;
    if (await this.isLoggedIn()) return;

    if (await this.page.getByText(this.welcomeToAppPattern()).isVisible().catch(() => false)) {
      await this.closeAuthModalIfOpen();
    }

    await this.page.evaluate(() => window.scrollTo(0, 0));

    const loginEntry = this.loginEntryButton();
    await loginEntry.scrollIntoViewIfNeeded();
    await loginEntry.click({ force: true });

    await this.page.getByText(/welcome back/i).waitFor({ state: 'visible', timeout: 15_000 });
    await this.emailField().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async openEmailSignInForm(): Promise<void> {
    await this.openLoginModal();
  }

  /** IDEA: Log in → Sign up (Get started does not open the email form). */
  async openEmailSignUpForm(): Promise<void> {
    await this.openLoginModal();
    await this.signUpSwitchLink().click({ force: true });
    await this.page.getByText(this.welcomeToAppPattern()).waitFor({ state: 'visible', timeout: 15_000 });
    await this.emailField().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async fillSignUpForm(email: string, password: string): Promise<void> {
    await this.emailField().fill(email);
    if (await this.passwordField().isVisible().catch(() => false)) {
      await this.passwordField().fill(password);
    }
  }

  async acceptRequiredConsents(): Promise<void> {
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      if (!(await box.isChecked().catch(() => false))) {
        await box.evaluate((el) => (el as HTMLInputElement).click());
      }
    }
  }

  async submitSignUp(): Promise<void> {
    const button = this.signUpSubmitButton();
    await expect(button).toBeEnabled({ timeout: 10_000 });
    await button.click({ force: true });
  }

  async submitSignIn(): Promise<void> {
    await this.signInSubmitButton().click();
  }

  async expectPaywallOrSubscription(): Promise<void> {
    const patterns = config.paywallHeading.split('|').map((part) => part.trim()).filter(Boolean);
    const escaped = patterns.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    await expect(this.page.getByText(new RegExp(escaped.join('|'), 'i')).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectValidationErrorsVisible(): Promise<void> {
    await expect(this.fieldValidationError().first()).toBeVisible({ timeout: 10_000 });
  }

  async expectEmailValidationTriggered(): Promise<void> {
    const email = this.emailField();
    await email.fill('not-an-email');
    await email.blur();
    await expect(this.page.getByText(/please enter a valid email/i)).toBeVisible({
      timeout: 10_000,
    });
  }
}
