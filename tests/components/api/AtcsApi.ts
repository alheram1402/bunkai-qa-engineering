/**
 * KATA Architecture - Layer 3: ATC API Component
 *
 * API component for Bunkai's ATC (Acceptance Test Case) resource — the
 * first domain entity wired by /adapt-framework (API-only, no UI component
 * this run; see .context/reports/adapt-framework-plan.md §1.6/§5).
 *
 * ATCs follow flow-based design: each ATC is an ACTION + VERIFICATION,
 * not a simple GET. Read-only operations are helpers (no @atc) unless the
 * read itself is the feature under test (search, in this case).
 *
 * Endpoints (relative to config.apiUrl, which already carries /api/v1):
 * - POST   /atcs                - create an ATC (steps + assertions + AC links)
 * - PATCH  /atcs/{id}            - full replace (optimistic lock via X-If-Match)
 * - POST   /atcs/{id}/duplicate  - deep-copy an ATC into a new one
 * - GET    /atcs/{id}/usage      - "used in N tests" report (helper)
 * - GET    /atcs/search          - project-scoped full-text search
 *
 * No GET /atcs/{id} exists on the target API — the read path goes through
 * search/usage only.
 */

import type { APIResponse } from '@playwright/test';
import type {
  AtcErrorResponse,
  AtcUsageResponse,
  CreateAtcRequest,
  CreateAtcResponse,
  DuplicateAtcRequest,
  DuplicateAtcResponse,
  SearchAtcsQuery,
  SearchAtcsResponse,
  UpdateAtcRequest,
  UpdateAtcResponse,
} from '@schemas/atcs.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

// Re-export types for consumers that import from AtcsApi
export type {
  AtcErrorResponse,
  AtcUsageResponse,
  CreateAtcRequest,
  CreateAtcResponse,
  DuplicateAtcRequest,
  DuplicateAtcResponse,
  SearchAtcsQuery,
  SearchAtcsResponse,
  UpdateAtcRequest,
  UpdateAtcResponse,
} from '@schemas/atcs.types';

// ============================================
// Types - Object param for updateAtcSuccessfully (3+ inputs -> object param)
// ============================================

export interface UpdateAtcArgs {
  id: string
  /** Current ATC version, sent as X-If-Match for optimistic locking. */
  currentVersion: number
  payload: UpdateAtcRequest
}

// ============================================
// ATC API Component
// ============================================

export class AtcsApi extends ApiBase {
  private readonly endpoints = {
    create: '/atcs',
    update: (id: string) => `/atcs/${id}`,
    duplicate: (id: string) => `/atcs/${id}/duplicate`,
    usage: (id: string) => `/atcs/${id}/usage`,
    search: '/atcs/search',
  };

  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Read-only operations (no @atc)
  // ============================================

  /**
   * Helper: "Used in N tests" report for an ATC.
   *
   * Read-only GET — a reachable ATC with no chaining Tests returns
   * `count: 0` + an empty `used_in` (never 404). Used as a verification
   * step inside other ATCs, or for test-level assertions.
   */
  @step
  async getAtcUsage(id: string): Promise<[APIResponse, AtcUsageResponse]> {
    const [response, body] = await this.apiGET<AtcUsageResponse>(this.endpoints.usage(id));
    return [response, body];
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Create an ATC anchored to a real acceptance criterion - expects success (201)
   *
   * Complete flow: POST steps + assertions + AC bindings, validate the
   * created resource. `payload.acceptance_criterion_ids` must be non-empty
   * and every id must belong to `payload.user_story_id`.
   *
   * @param payload - Full create body (title, module_id, user_story_id, layer, steps, acceptance_criterion_ids, ...)
   * @returns Tuple with response, created ATC, and sent payload
   */
  @atc('BK-201')
  async createAtcSuccessfully(
    payload: CreateAtcRequest,
  ): Promise<[APIResponse, CreateAtcResponse, CreateAtcRequest]> {
    const [response, body, sentPayload] = await this.apiPOST<CreateAtcResponse, CreateAtcRequest>(
      this.endpoints.create,
      payload,
    );

    // Fixed assertions - validates the create succeeded
    expect(response.status()).toBe(201);
    expect(body.atc).toBeDefined();
    expect(body.atc.id).toBeDefined();
    expect(body.atc.version).toBe(1);
    expect(body.atc.acceptance_criterion_ids.length).toBeGreaterThanOrEqual(1);

    return [response, body, sentPayload];
  }

  /**
   * ATC: Create an ATC with an empty AC-anchor array - expects rejection (422)
   *
   * `acceptance_criterion_ids` is a required, non-empty field on the create
   * body — an empty array fails schema validation (`error.code ===
   * 'validation_failed'`) BEFORE it ever reaches the RPC-level
   * `ac_outside_user_story` guard (Postgres SQLSTATE 45020), which only
   * fires for a non-empty array containing an AC that belongs to a
   * DIFFERENT user story. This ATC exercises the schema-level guard, the
   * one reachable without a second, cross-story AC fixture.
   *
   * @param payload - Create body with `acceptance_criterion_ids: []`
   * @returns Tuple with error response and sent payload
   */
  @atc('BK-202')
  async createAtcWithoutAcAnchorFails(
    payload: CreateAtcRequest,
  ): Promise<[APIResponse, AtcErrorResponse, CreateAtcRequest]> {
    const [response, body, sentPayload] = await this.apiPOST<AtcErrorResponse, CreateAtcRequest>(
      this.endpoints.create,
      payload,
    );

    // Fixed assertions - validates the rejection
    expect(response.status()).toBe(422);
    expect(response.ok()).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('validation_failed');

    return [response, body, sentPayload];
  }

  /**
   * ATC: Update an ATC with a matching version - expects success (200)
   *
   * Complete flow: PATCH a full replace of steps/assertions/AC bindings,
   * using X-If-Match (NOT the standard If-Match — the Vercel edge intercepts
   * If-Match and rewrites the response to 412, BK-96) for optimistic
   * locking. Validates the version bump and the affected-test-count report.
   *
   * @param args - { id, currentVersion, payload }
   * @returns Tuple with response, updated ATC + version + affected_test_count, and sent payload
   */
  @atc('BK-203')
  async updateAtcSuccessfully(
    args: UpdateAtcArgs,
  ): Promise<[APIResponse, UpdateAtcResponse, UpdateAtcRequest]> {
    const [response, body, sentPayload] = await this.apiPATCH<UpdateAtcResponse, UpdateAtcRequest>(
      this.endpoints.update(args.id),
      args.payload,
      { headers: { 'X-If-Match': String(args.currentVersion) } },
    );

    // Fixed assertions - validates the update succeeded
    expect(response.status()).toBe(200);
    expect(body.atc).toBeDefined();
    expect(body.version).toBeGreaterThanOrEqual(args.currentVersion);
    expect(body.affected_test_count).toBeGreaterThanOrEqual(0);

    return [response, body, sentPayload];
  }

  /**
   * ATC: Duplicate an ATC - expects success (201)
   *
   * Complete flow: POST a deep-copy request, validate the new resource is
   * independent from the source (fresh id, version reset to 1).
   *
   * @param id - The source ATC to duplicate
   * @param newTitle - Optional title for the copy (defaults to `<source> (copy)`)
   * @returns Tuple with response, duplicated ATC, and sent payload
   */
  @atc('BK-204')
  async duplicateAtcSuccessfully(
    id: string,
    newTitle?: string,
  ): Promise<[APIResponse, DuplicateAtcResponse, DuplicateAtcRequest]> {
    const payload: DuplicateAtcRequest = newTitle !== undefined ? { new_title: newTitle } : {};

    const [response, body, sentPayload] = await this.apiPOST<DuplicateAtcResponse, DuplicateAtcRequest>(
      this.endpoints.duplicate(id),
      payload,
    );

    // Fixed assertions - validates the duplicate is a real, independent ATC
    expect(response.status()).toBe(201);
    expect(body.atc).toBeDefined();
    expect(body.atc.id).not.toBe(id);
    expect(body.atc.version).toBe(1);

    return [response, body, sentPayload];
  }

  /**
   * ATC: Search ATCs by title - expects success (200)
   *
   * Complete flow: GET a project-scoped full-text search, validate the
   * response shape. Zero matches return an empty `items` array (never 404).
   *
   * @param query - Search query (free-text `query` + required `project_id`, optional module_id/layer/limit)
   * @returns Tuple with response and matched items
   */
  @atc('BK-205')
  async searchAtcsByTitle(query: SearchAtcsQuery): Promise<[APIResponse, SearchAtcsResponse]> {
    const [response, body] = await this.apiGET<SearchAtcsResponse>(this.endpoints.search, {
      params: query as unknown as Record<string, string>,
    });

    // Fixed assertions - validates the search response shape
    expect(response.status()).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);

    return [response, body];
  }
}
