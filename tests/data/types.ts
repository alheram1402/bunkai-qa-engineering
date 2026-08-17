/**
 * KATA Architecture - Test Data Types
 *
 * Types for test data generation and fixture state.
 * These are TEST-ONLY concepts — NOT API contract types.
 *
 * API contract types (request/response schemas) belong in:
 *   api/schemas/{domain}.types.ts → import from '@schemas/{domain}.types'
 */

// ============================================
// Generic Types
// ============================================

export interface TestUser {
  email: string
  password: string
  name: string
  firstName?: string
  lastName?: string
}

export interface TestCredentials {
  email: string
  password: string
}

// ============================================
// Project-Specific Types (Bunkai domain: ATC)
// ============================================

/**
 * The fabricatable slice of an ATC create/update body — title, layer, tags,
 * steps, and assertions can all be generated with faker. The identity chain
 * (`module_id`, `user_story_id`, `acceptance_criterion_ids`) CANNOT be
 * fabricated — those must reference real, already-existing hierarchy
 * entities, so callers merge them in separately when building the real
 * `CreateAtcRequest` / `UpdateAtcRequest` (see `api/schemas/atcs.types.ts`).
 */
export interface TestAtc {
  title: string
  layer: 'UI' | 'API' | 'Unit'
  tags: string[]
  steps: {
    position: number
    content: string
    input_data?: string | null
    expected?: string | null
  }[]
  assertions: {
    content: string
  }[]
}

// ============================================
// Auth/Fixture State Types
// ============================================

/**
 * Stored API state for test fixtures
 * Used by setup files and TestFixture for token propagation
 */
export interface ApiState {
  token: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
  source: 'ui-login' | 'api-login'
  createdAt: string
}
