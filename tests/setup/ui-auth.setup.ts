/**
 * KATA Architecture - UI Auth Setup
 *
 * Authenticates via the login page UI and intercepts the PAT issued by
 * POST /api/v1/auth/signin using page.waitForResponse() - single
 * authentication, no separate API call.
 *
 * Bunkai's auth is Supabase Auth/GoTrue-backed (NOT NextAuth). The password
 * step of the two-step login form calls the SAME headless
 * /api/v1/auth/signin endpoint used by scripts/api-login.ts, so the JSON
 * response body also carries a freshly-minted PAT even though the browser
 * primarily relies on the session cookie the route sets as a side-effect.
 *
 * This provides BOTH:
 * - Browser session (storageState) for UI tests
 * - API token (intercepted PAT) for API calls within E2E tests
 *
 * Dependencies: global-setup
 * Dependents: e2e
 */

import type { ApiState } from '@data/types';
import type { LoginSuccessResponse } from '@schemas/auth.types';

import { writeFileSync } from 'node:fs';
import { test as setup } from '@TestFixture';
import { attachRequestResponseToAllure } from '@utils/allure';
import { config } from '@variables';

const storageStateFile = config.auth.storageStatePath;
const apiStateFile = config.auth.apiStatePath;

/**
 * UI Authentication Setup
 *
 * 1. Navigates to login page (via LoginPage.goto())
 * 2. Sets up response interception BEFORE triggering login
 * 3. Uses LoginPage.loginSuccessfully() ATC (triggers login + token fetch)
 * 4. Captures JWT token from intercepted response
 * 5. Saves storageState (cookies) for UI tests
 * 6. Saves api-state (token) for API integration
 */
setup('UI Setup: authenticate via UI', async ({ ui, page }) => {
  console.log('[UI Setup] Starting UI authentication...');
  console.log('[UI Setup] Target: /login');

  // Navigate to login page (outside of ATC)
  await ui.login.goto();

  // Credentials for login
  const credentials = {
    email: config.testUser.email,
    password: config.testUser.password,
  };

  // Set up response interception BEFORE triggering login
  // The login UI's password step calls POST /api/v1/auth/signin directly
  // (the same headless endpoint scripts/api-login.ts uses)
  const tokenPromise = page.waitForResponse(
    resp => resp.url().includes(config.auth.tokenEndpoint)
      && resp.request().method() === 'POST'
      && resp.status() === 200,
    { timeout: 30000 },
  );

  // Use LoginPage ATC - triggers Supabase Auth sign-in + PAT mint
  await ui.login.loginSuccessfully(credentials);
  console.log('[UI Setup] UI login successful');

  // Capture the PAT from the intercepted sign-in response
  console.log('[UI Setup] Intercepting token from login response...');
  const response = await tokenPromise;
  const tokenData = (await response.json()) as LoginSuccessResponse;

  // Attach to Allure for debugging
  await attachRequestResponseToAllure({
    url: response.url(),
    method: 'POST',
    responseBody: tokenData,
    requestBody: { email: credentials.email, password: '***' },
  });

  // Verify token was obtained (pat.token, NOT session.access_token)
  if (!tokenData?.pat?.token) {
    throw new Error('Sign-in response missing pat.token');
  }

  console.log('[UI Setup] Token intercepted successfully');

  // Save storage state (cookies + localStorage) for UI tests
  await page.context().storageState({ path: storageStateFile });
  console.log(`[UI Setup] Storage state saved to ${storageStateFile}`);

  // Save the PAT for API calls within E2E tests
  const apiState: ApiState = {
    token: tokenData.pat.token,
    tokenType: 'Bearer',
    expiresIn: tokenData.pat.expires_at
      ? Math.max(0, Math.floor((new Date(tokenData.pat.expires_at).getTime() - Date.now()) / 1000))
      : config.auth.tokenLifetimeSeconds,
    refreshToken: null,
    source: 'ui-login',
    createdAt: new Date().toISOString(),
  };

  writeFileSync(apiStateFile, JSON.stringify(apiState, null, 2));
  console.log(`[UI Setup] API token saved to ${apiStateFile}`);

  console.log('[UI Setup] Authentication successful');
  console.log(`[UI Setup] Current URL: ${page.url()}`);
});
