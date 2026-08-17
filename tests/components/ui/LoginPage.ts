/**
 * KATA Architecture - Layer 3: Login Page Component
 *
 * UI component for authentication via the Bunkai login page.
 * Two-step form: email -> continue -> password -> sign in.
 * Only the existing+confirmed happy-path branch is wired this run —
 * OTP/signup branches are deferred (see .context/reports/adapt-framework-plan.md §2/§11).
 *
 * Page: /login
 * Locators (data-testid, confirmed against app/(auth)/login/email-first-form.tsx):
 * - Email (step 1): [data-testid="login-email"]
 * - Continue (step 1): [data-testid="login-continue"]
 * - Password (step 2): [data-testid="login-password"]
 * - Sign in (step 2): [data-testid="login-signin"]
 * - Error: [data-testid="login-error"] (role="alert")
 * - Post-login landmark: the "Projects" heading on /projects —
 *   safeInternalPath()'s fallback redirect target when no ?next= is present.
 *   The "New project" CTA (`projects-new-link`) is conditionally hidden when
 *   the active workspace has zero projects (empty-state branch), so the
 *   always-present page heading is the only stable landmark here.
 */

import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

// ============================================
// Types - Login data structures
// ============================================

export interface LoginCredentials {
  email: string
  password: string
}

// ============================================
// Login Page Component
// ============================================

export class LoginPage extends UiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers (Private)
  // ============================================

  /**
   * Fill and submit the two-step login form (email -> continue -> password -> sign in).
   * Happy path only — the existing+confirmed branch (no OTP/signup handling).
   */
  private async fillAndSubmitLoginForm(credentials: LoginCredentials): Promise<void> {
    await this.page.locator('[data-testid="login-email"]').fill(credentials.email);
    await this.page.locator('[data-testid="login-continue"]').click();

    await this.page.locator('[data-testid="login-password"]').fill(credentials.password);
    await this.page.locator('[data-testid="login-signin"]').click();
  }

  // ============================================
  // Navigation (Public)
  // ============================================

  /**
   * Navigate to the login page
   * Call this BEFORE using login ATCs
   */
  @step
  async goto(): Promise<void> {
    await this.page.goto(this.buildUrl('/login'));
  }

  // ============================================
  // ATCs - Complete Test Cases
  // ============================================

  /**
   * ATC: Login with valid credentials - expects success
   *
   * IMPORTANT: Call goto() before this ATC.
   * Fills the two-step form, submits, and verifies the redirect to /projects
   * (the app's fallback target when no ?next= query param is present) plus a
   * stable post-login landmark.
   *
   * @param credentials - Email and password
   */
  @atc('BK-101')
  async loginSuccessfully(credentials: LoginCredentials): Promise<void> {
    await this.fillAndSubmitLoginForm(credentials);

    // Wait for authentication to complete and redirect
    await this.page.waitForURL(/\/projects/, { timeout: 15000 });
    await expect(this.page).not.toHaveURL(/.*\/login.*/);
    await expect(this.page.getByRole('heading', { name: 'Projects' })).toBeVisible({ timeout: 10000 });
  }

  /**
   * ATC: Login with invalid credentials - expects error
   *
   * IMPORTANT: Call goto() before this ATC.
   * Fills invalid credentials, submits, and verifies the error alert.
   *
   * @param credentials - Invalid email or password
   */
  @atc('BK-102')
  async loginWithInvalidCredentials(credentials: LoginCredentials): Promise<void> {
    await this.fillAndSubmitLoginForm(credentials);

    // Fixed assertion - error should be visible
    const errorIndicator = this.page.locator('[data-testid="login-error"]');
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
    await expect(this.page).toHaveURL(/.*\/login.*/);
  }
}
