/**
 * KATA Architecture - User Session Integration Tests
 *
 * Tests for authenticated user session via API.
 * Validates that PAT (Bearer token) propagation works correctly against
 * Bunkai's real /api/v1/auth/signin + /api/v1/me endpoints.
 *
 * Project: integration (depends on api-setup)
 */

import { config, expect, test } from '@TestFixture';

test.describe('BK-101: User Session API', { tag: ['@critical'] }, () => {
  /**
   * Validates that the PAT is automatically loaded from api-state.json
   * and can be used to make authenticated API calls.
   */
  test('BK-101: should get current user with valid token', async ({ api }) => {
    // The PAT is automatically loaded from api-state.json by ApiFixture
    // Use helper (not ATC) — this is a read-only verification
    const [response, userData] = await api.auth.getCurrentUser();

    // Test-level assertions (Bunkai /api/v1/me shape)
    expect(response.status()).toBe(200);
    expect(userData.user).toBeDefined();
    expect(userData.user.id).toBeDefined();
    expect(userData.user.email).toBeDefined();
    expect(userData.auth.source).toBe('bearer');
  });

  /**
   * Validates that unauthenticated requests are rejected.
   *
   * Bunkai's HYBRID auth means POST /auth/signin sets a Supabase SSR session
   * cookie as a side effect of minting the PAT. That cookie lives in the
   * shared, worker-scoped Playwright APIRequestContext (playwright.config.ts
   * runs `workers: 1`), so clearing ONLY the Bearer token via
   * `api.clearAuthToken()` is not enough — a request made through the `api`
   * fixture would still authenticate via the leftover cookie from an earlier
   * signin (e.g. api-auth.setup.ts). A genuinely unauthenticated check needs
   * a cookie-free request, hence the plain fetch() instead of the fixture.
   */
  test('BK-101: should fail without token', async () => {
    const response = await fetch(`${config.apiUrl}${config.auth.meEndpoint}`, {
      headers: { Accept: '*/*' },
    });

    // Test-level assertions — no session should exist
    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
  });

  /**
   * Validates that we can re-authenticate and mint a new PAT.
   * This tests the per-run-mint token strategy (no auto-refresh).
   */
  test('BK-101: should be able to re-authenticate', async ({ api }) => {
    // Clear existing token
    api.clearAuthToken();

    // Re-authenticate using the ATC
    const credentials = {
      email: config.testUser.email,
      password: config.testUser.password,
    };

    const [response, signinBody] = await api.auth.authenticateSuccessfully(credentials);

    // Verify a new PAT was obtained and set (pat.token, NOT session.access_token)
    expect(response.status()).toBe(200);
    expect(signinBody.pat.token).toBeDefined();
  });
});
