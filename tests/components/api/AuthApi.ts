/**
 * KATA Architecture - Layer 3: Auth API Component
 *
 * API component for authentication operations against Bunkai's HYBRID auth
 * model: Supabase SSR cookie session for the browser, Bearer PAT for
 * API/agentic callers (see .context/reports/adapt-framework-plan.md §2).
 *
 * ATCs follow flow-based design: each ATC is an ACTION + VERIFICATION,
 * not a simple GET. Read-only operations are helpers (no @atc).
 *
 * Endpoints (relative to config.apiUrl, which already carries /api/v1):
 * - POST /auth/signin - headless sign-in, returns { user, session, pat, warning }
 * - GET /me           - current principal + workspace memberships + auth source
 *
 * The Bearer token used for subsequent requests is `pat.token`, NOT
 * `session.access_token` (that one belongs to the Supabase SSR cookie
 * session and is never sent as a Bearer header).
 */

import type { APIResponse } from '@playwright/test';
import type {
  AuthErrorResponse,
  LoginPayload,
  LoginSuccessResponse,
  UserInfoResponse,
} from '@schemas/auth.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

// Re-export types for consumers that import from AuthApi
export type { AuthErrorResponse, LoginPayload, LoginSuccessResponse, UserInfoResponse } from '@schemas/auth.types';

// ============================================
// Auth API Component
// ============================================

export class AuthApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Read-only operations (no @atc)
  // ============================================

  /**
   * Helper: Get current authenticated user info (works with cookie OR Bearer auth).
   *
   * Read-only GET — used as a verification step inside ATCs
   * or for test-level assertions. Not an ATC because it's
   * just a data retrieval, not a complete action flow.
   *
   * @returns Tuple with response and identity snapshot
   */
  @step
  async getCurrentUser(): Promise<[APIResponse, UserInfoResponse]> {
    const [response, body] = await this.apiGET<UserInfoResponse>(this.config.auth.meEndpoint);
    return [response, body];
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Authenticate with valid credentials - expects success (200)
   *
   * Complete flow:
   * 1. POST credentials to /auth/signin (ACTION) - mints a session + a PAT
   * 2. GET /me to confirm the PAT authenticates (VERIFICATION)
   * 3. Validate the nested { user, session, pat } response
   *
   * The PAT (`pat.token`) is stored for subsequent Bearer-authenticated
   * requests — the session cookie itself is not usable by API-only tests.
   *
   * @param credentials - Email and password
   * @returns Tuple with response, nested sign-in body, and sent payload
   */
  @atc('BK-101')
  async authenticateSuccessfully(
    credentials: LoginPayload,
  ): Promise<[APIResponse, LoginSuccessResponse, LoginPayload]> {
    // ACTION: POST login credentials
    const [response, body, sentPayload] = await this.apiPOST<LoginSuccessResponse, LoginPayload>(
      this.config.auth.loginEndpoint,
      credentials,
    );

    // Fixed assertions - validates successful authentication
    expect(response.status()).toBe(200);
    expect(body.user).toBeDefined();
    expect(body.pat?.token).toBeDefined();

    // Store the PAT for subsequent requests (NOT session.access_token)
    this.setAuthToken(body.pat.token);

    // VERIFICATION: Confirm the PAT authenticates via GET /me
    const [meResponse, meBody] = await this.getCurrentUser();
    expect(meResponse.status()).toBe(200);
    expect(meBody.user).toBeDefined();
    expect(meBody.user.email).toBe(credentials.email);
    expect(meBody.auth.source).toBe('bearer');

    return [response, body, sentPayload];
  }

  /**
   * ATC: Login with invalid credentials - expects error (401)
   *
   * Complete flow:
   * 1. POST invalid credentials to /auth/signin (ACTION)
   * 2. GET /me to confirm NO session was created (VERIFICATION)
   * 3. Validate the error envelope
   *
   * @param credentials - Invalid email or password
   * @returns Tuple with error response and sent payload
   */
  @atc('BK-102')
  async loginWithInvalidCredentials(
    credentials: LoginPayload,
  ): Promise<[APIResponse, AuthErrorResponse, LoginPayload]> {
    // ACTION: POST invalid credentials
    const [response, body, sentPayload] = await this.apiPOST<AuthErrorResponse, LoginPayload>(
      this.config.auth.loginEndpoint,
      credentials,
    );

    // Fixed assertions - validates the error envelope (docs: "Invalid credentials")
    expect(response.status()).toBe(401);
    expect(response.ok()).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.message).toBeDefined();

    // VERIFICATION: Confirm no session was created via GET /me -> 401
    const savedToken = this.authToken;
    this.clearAuthToken();
    const [meResponse] = await this.getCurrentUser();
    expect(meResponse.status()).toBe(401);
    // Restore token if one existed before this ATC
    if (savedToken) {
      this.setAuthToken(savedToken);
    }

    return [response, body, sentPayload];
  }
}
