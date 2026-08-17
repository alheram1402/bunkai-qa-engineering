/**
 * KATA Framework - OpenAPI Type Facades (Barrel Export)
 *
 * Re-exports all domain type facades for cross-domain imports.
 * Prefer importing from specific domain files: import type { X } from '@schemas/auth.types'
 * Use this barrel only when you need types from multiple domains in one file.
 *
 * Usage:
 *   import type { LoginPayload, LoginSuccessResponse } from '@schemas/auth.types';  // preferred
 *   import type { LoginPayload, Atc } from '@schemas';                              // cross-domain
 */

export type * from './atcs.types';
export type * from './auth.types';

// Add new domain facades here (e.g. workspaces, projects, modules, user-stories):
// export type * from './workspaces.types';
