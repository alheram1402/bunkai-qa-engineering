/**
 * KATA Architecture - ATC Smoke Test
 *
 * API-only @critical smoke test for the ATC entity — Bunkai's first domain
 * component wired by /adapt-framework. No pre-existing DB seed data is
 * assumed in the target workspace, so this test GENERATES a real anchor
 * chain (project -> module -> user story -> acceptance criterion) via the
 * API itself, then exercises AtcsApi against it.
 *
 * The hierarchy-seeding calls below use api.apiPOST/apiGET directly
 * (inherited from ApiBase via ApiFixture) rather than dedicated KATA
 * components — Workspaces/Projects/Modules/UserStories are out of scope
 * for a facade this run (only ATC has one); these are one-off precondition
 * calls, not ATCs.
 */

import type { ApiFixture } from '@ApiFixture';
import type { CreateAtcRequest } from '@schemas/atcs.types';

import { DataFactory } from '@data/DataFactory';
import { expect, test } from '@TestFixture';

// ============================================
// Minimal local types for one-off hierarchy setup
// ============================================

interface MeResponse {
  active_workspace_id: string | null
  workspaces: { id: string }[]
}

interface ProjectCreateResponse {
  project: { id: string }
}

interface ModuleCreateResponse {
  module: { id: string }
}

interface UserStoryCreateResponse {
  user_story: { id: string }
}

interface AcceptanceCriterionCreateResponse {
  acceptance_criterion: { id: string }
}

// ============================================
// Precondition helper (NOT a Step module — file-scoped, single caller today)
// ============================================

/**
 * Generates a fresh project -> module -> user story -> acceptance criterion
 * chain via the API, and returns the real ids an ATC can anchor to. Each
 * test that calls this gets its own independent chain (KATA rule: no shared
 * state between tests).
 */
async function seedAcAnchor(
  api: ApiFixture,
): Promise<{ moduleId: string, userStoryId: string, acceptanceCriterionId: string }> {
  const [, me] = await api.apiGET<MeResponse>('/me');
  const workspaceId = me.active_workspace_id ?? me.workspaces[0]?.id;
  expect(workspaceId, 'test user must belong to at least one workspace').toBeDefined();

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const [, projectBody] = await api.apiPOST<ProjectCreateResponse, { name: string }>(
    `/workspaces/${workspaceId}/projects`,
    { name: `Smoke Project ${suffix}` },
  );

  const [, moduleBody] = await api.apiPOST<ModuleCreateResponse, { name: string }>(
    `/projects/${projectBody.project.id}/modules`,
    { name: `Smoke Module ${suffix}` },
  );

  const [, storyBody] = await api.apiPOST<UserStoryCreateResponse, { title: string }>(
    `/modules/${moduleBody.module.id}/user-stories`,
    { title: `Smoke Story ${suffix}` },
  );

  const [, acBody] = await api.apiPOST<AcceptanceCriterionCreateResponse, { title: string }>(
    `/user-stories/${storyBody.user_story.id}/acceptance-criteria`,
    { title: `Smoke AC ${suffix}` },
  );

  return {
    moduleId: moduleBody.module.id,
    userStoryId: storyBody.user_story.id,
    acceptanceCriterionId: acBody.acceptance_criterion.id,
  };
}

test.describe('BK-201: ATC creation', { tag: ['@critical'] }, () => {
  test('BK-201: should create an ATC anchored to a real acceptance criterion', async ({ api }) => {
    const { moduleId, userStoryId, acceptanceCriterionId } = await seedAcAnchor(api);

    const payload: CreateAtcRequest = {
      ...DataFactory.createAtc(),
      module_id: moduleId,
      user_story_id: userStoryId,
      acceptance_criterion_ids: [acceptanceCriterionId],
    };

    const [response, body] = await api.atcs.createAtcSuccessfully(payload);

    expect(response.status()).toBe(201);
    expect(body.atc.module_id).toBe(moduleId);
    expect(body.atc.user_story_id).toBe(userStoryId);
    expect(body.atc.acceptance_criterion_ids).toContain(acceptanceCriterionId);
  });

  test('BK-202: should reject ATC creation with an empty AC-anchor array', async ({ api }) => {
    const { moduleId, userStoryId } = await seedAcAnchor(api);

    const payload: CreateAtcRequest = {
      ...DataFactory.createAtc(),
      module_id: moduleId,
      user_story_id: userStoryId,
      acceptance_criterion_ids: [],
    };

    const [response, body] = await api.atcs.createAtcWithoutAcAnchorFails(payload);

    expect(response.status()).toBe(422);
    expect(body.error.code).toBe('validation_failed');
  });
});
