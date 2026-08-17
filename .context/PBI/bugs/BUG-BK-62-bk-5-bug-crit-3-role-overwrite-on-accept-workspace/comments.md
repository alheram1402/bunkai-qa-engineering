# Comments for BK-62

[View in Jira](https://jira.upexgalaxy.com/browse/BK-62)

---

### Nahuel Gomez - 6/5/2026, 4:36:41 PM

## Test Evidence — [https://jira.upexgalaxy.com/browse/BK-62#icft=BK-62](https://jira.upexgalaxy.com/browse/BK-62#icft=BK-62)

### Repro Steps

```java
# 1. Owner creates invite for member role
curl -X POST https://staging-upexbunkai.vercel.app/api/v1/workspaces/aed86386-2ed8-424e-934b-ca7a0ef6af37/invites \
  -H 'content-type: application/json' \
  -d '{"email":"qa-headless@bunkai.io","role":"member"}'
# → 201, token: bk*inv*2rTgTxbLC5R21dcL6WpGX

# 2. Owner accepts the member-role invite
curl -X POST https://staging-upexbunkai.vercel.app/api/v1/invites/accept \
  -H 'content-type: application/json' \
  -d '{"token":"bk*inv*2rTgTxbLC5R21dcL6WpGX"}'
# → 201 Accepted

# 3. Check role in DB — OWNER DEMOTED TO MEMBER
```

### Actual (BUG): Role overwritten to member

```sql
-- BEFORE accept:
SELECT user*id, role FROM workspace*members
WHERE workspace_id = 'aed86386-2ed8-424e-934b-ca7a0ef6af37'
  AND email = 'qa-headless@bunkai.io';
-- role: owner ✅

-- AFTER accept:
SELECT user*id, role FROM workspace*members
WHERE workspace_id = 'aed86386-2ed8-424e-934b-ca7a0ef6af37'
  AND email = 'qa-headless@bunkai.io';
-- role: member ❌  (DEMOTED!)
```

### DB Evidence (live — staging, workspace aed86386)

```sql
SELECT wm.role, wi.role AS invited_role
FROM workspace_members wm
JOIN workspace*invites wi ON wi.workspace*id = wm.workspace_id
WHERE wm.workspace_id = 'aed86386-2ed8-424e-934b-ca7a0ef6af37'
  AND wm.email = 'qa-headless@bunkai.io';

-- Result: wm.role = 'member', wi.role = 'member'
-- Owner was demoted from 'owner' to 'member' by the accept upsert
```

### Root Cause — `app/api/v1/invites/accept/route.ts:77-87`

```
// PROBLEM: upsert sets role unconditionally
const { data: member, error } = await supabase
  .from("workspace_members")
  .upsert({
    workspace_id,
    user_id: authUser.id,
    role: invite.role,  // ← ALWAYS overwrites, even if user is owner/admin
    status: "active",
  }, { onConflict: "workspace*id,user*id" })
```

### Impact

- ***Data integrity breach***: workspace `aed86386` owner permanently demoted to member
- No way to undo via API (no role-change endpoint)
- Requires manual DB fix on staging

### Fix

Check existing membership before upsert:

```
const {data: existing} = await supabase.from("workspace_members")
  .select("role").eq("workspace*id", workspace*id).eq("user_id", authUser.id).single();

if (existing && roleHierarchy[existing.role] >= roleHierarchy[invite.role]) {
  return error(409, "ALREADY_MEMBER", "You are already a member with equal or higher role");
}
// else upsert with NEW role
```

---

### Automation for Jira - 6/10/2026, 3:24:37 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 3:24:46 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 3:28:07 PM

## 🔧 Bug Fix Documentation

### Root Cause Analysis

***Category:*** Code Error
***Location:*** `app/api/v1/invites/accept/route.ts` — membership upsert

The accept handler ran an ***unconditional*** `workspace_members.upsert` with `role = invite.role` — any existing row (including an owner's) was overwritten with the invite's role. Exactly the reported demotion: owner accepts a member-role invite → owner becomes member.

### Fix Applied

- New pure decision helper `inviteAcceptAction` (`lib/workspaces/invites.ts`, rank: viewer < member < admin < owner):
- 8 unit tests including the exact owner-demotion repro.
- Defense in depth: BK-60's fix prevents issuing invites to active members in the first place, sealing the demotion vector at both ends.

***PR:**** [https://github.com/upex-galaxy/upex-bunkai-tms/pull/34](https://github.com/upex-galaxy/upex-bunkai-tms/pull/34) (merged to `staging`, commit `8c67211`, deployed) · ****Fix Type:*** Bugfix · Gates: `bun test` 192/192 (8 new unit tests), `tsc` clean, `eslint` clean.

### Data Repair (staging)

Workspace `aed86386-2ed8-424e-934b-ca7a0ef6af37` ("QA Test Workspace") — the damaged owner row was restored ***member → owner*** via a 1-row UPDATE keyed on `workspaces.owner*user*id` (verified with RETURNING). The reported damage is undone.

### Verification Performed

- [x] Unit repro: `inviteAcceptAction({role:'owner',status:'active'}, 'member')` → `reject*already*member` (test green)
- [x] Equal role → reject · member→admin promotion → allowed · `status='invited'` activation → allowed (all tested)
- [x] Staging owner row of aed86386 verified `role='owner'` after repair

### How to Verify

1. With a legacy/pre-existing invite addressed to an active member (new ones are now blocked by [https://jira.upexgalaxy.com/browse/BK-60#icft=BK-60](https://jira.upexgalaxy.com/browse/BK-60#icft=BK-60)), accept it as that member
2. ***Expected:*** 409 `already*member*equal*or*higher_role`; the member's role is unchanged
3. Verify the aed86386 workspace owner can manage the workspace again (role restored)

---

**Fix ready for QA verification.**

---

### Nahuel Gomez - 6/10/2026, 5:22:20 PM

1. 

****Retest date****: 2026-06-10
****Environment****: staging

1. 

Attempted POST /workspaces/aed86386.../invites {email:"qa-headless@bunkai.io", role:"member"} → 409 ✓

1. 

1. 

1. 

---

### Ely - 6/25/2026, 9:00:22 PM

## 🤖 Curación de campos QA (estándar Bunkai)

Curación automática de campos QA según el estándar Bunkai. Justificación:

| ***Campo**** | ****Valor aplicado**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Tenancy & Identity | Defecto en membresías de workspace al aceptar invitación (sobrescritura de rol), dominio de Identidad y Tenencia. Epic original [https://jira.upexgalaxy.com/browse/BK-1#icft=BK-1](https://jira.upexgalaxy.com/browse/BK-1#icft=BK-1) mapea a este componente. |
| Epic padre | BK-183 (Defect Management) | Reparentado al epic de gestión de defectos. |
| Test Environment | Staging | Reportado en staging (workspace `aed86386` afectado). |
| Severity | Crítica | Brecha de integridad de datos: el owner es degradado a member de forma incondicional; explotable para reducción de privilegios. Requiere fix manual en BD. |
| Priority | Highest | Alineada a Severity Crítica. |
| Error Type | Functional | Lógica funcional incorrecta en el `upsert` de aceptación. |
| Root Cause | Code Error | Causa establecida: `workspace_members.upsert` fija `role=invite.role` incondicionalmente en `accept/route.ts:77-87`. |

Ningún campo quedó en blanco.

---


_Synced from Jira by sync-jira-issues_
