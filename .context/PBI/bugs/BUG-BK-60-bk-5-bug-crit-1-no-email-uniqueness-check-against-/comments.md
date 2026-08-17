# Comments for BK-60

[View in Jira](https://jira.upexgalaxy.com/browse/BK-60)

---

### Nahuel Gomez - 6/5/2026, 4:36:23 PM

## Test Evidence — [https://jira.upexgalaxy.com/browse/BK-60#icft=BK-60](https://jira.upexgalaxy.com/browse/BK-60#icft=BK-60)

### Repro Steps

```java
# 1. Get workspace ID (workspace aed86386 has owner qa-headless@bunkai.io)
curl -H 'Authorization: Bearer bk*pat*ZBOc...' \
  https://staging-upexbunkai.vercel.app/api/v1/workspaces

# 2. Owner invites themselves (email already a member)
curl -X POST https://staging-upexbunkai.vercel.app/api/v1/workspaces/aed86386-2ed8-424e-934b-ca7a0ef6af37/invites \
  -H 'content-type: application/json' \
  -d '{"email":"qa-headless@bunkai.io","role":"member"}'
```

### Actual (BUG): 201 Created

```json
{
  "invite": {
    "id": "bbb9a656-8f86-4ff4-bd97-2acacfc9d1c1",
    "workspace_id": "aed86386-2ed8-424e-934b-ca7a0ef6af37",
    "email": "qa-headless@bunkai.io",
    "role": "member",
    "status": "pending"
  },
  "token": "bk*inv*2rTgTxbLC5R21dcL6WpGX",
  "accept*url": "/invites/accept?token=bk*inv_2rTgTxbLC5R21dcL6WpGX"
}
```

### Expected: 409 Conflict

```json
{
  "error": "EMAIL*ALREADY*MEMBER",
  "message": "This email already belongs to an active workspace member"
}
```

### DB Evidence

`qa-headless@bunkai.io` IS already a member of workspace `aed86386`:

```sql
SELECT email, role FROM workspace*members WHERE workspace*id = 'aed86386-2ed8-424e-934b-ca7a0ef6af37';
-- email: qa-headless@bunkai.io, role: member (was owner, demoted by BUG-CRIT-3 BK-62)
```

### Spec Reference

FR-003 Business Rule: "email MUST be unique among active workspace members."

---

### Automation for Jira - 6/10/2026, 3:24:37 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 3:24:46 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 3:28:05 PM

## 🔧 Bug Fix Documentation

### Root Cause Analysis

***Category:*** Code Error
***Location:*** `app/api/v1/workspaces/[id]/invites/route.ts` — POST handler

The handler inserted the invite with ***zero uniqueness checks*** — no query against `workspace*members` before insert. Note: `workspace*members` has no email column; mapping email→user requires `auth.users`, which PostgREST does not expose — likely why the check was skipped originally.

### Fix Applied

- New SECURITY DEFINER fn `bunkai*user*id*by*email` (migration 0022, callable by service role only) resolves the email without exposing `auth.users`.
- POST now returns ***409*** `email*already*member` ("This email already belongs to an active workspace member.") when the email maps to an ACTIVE member — per FR-003.
- The admin/owner gate runs BEFORE the uniqueness probes, so non-admins cannot use the endpoint to discover membership facts.

***PR:**** [https://github.com/upex-galaxy/upex-bunkai-tms/pull/34](https://github.com/upex-galaxy/upex-bunkai-tms/pull/34) (merged to `staging`, commit `8c67211`, deployed) · ****Fix Type:*** Bugfix · Gates: `bun test` 192/192 (8 new unit tests), `tsc` clean, `eslint` clean.

### Verification Performed (staging, post-deploy)

- [x] QA repro: invite issued for an active member's email → ***HTTP 409*** `{"code":"conflict","reason":"email*already*member"`} (was 201 + token leak)

### How to Verify

1. As workspace admin/owner, POST `/api/v1/workspaces/{id}/invites` with the email of an existing ACTIVE member
2. ***Expected:*** 409 with `details.reason = email*already*member`; no invite row, no token

---

**Fix ready for QA verification.**

---

### Nahuel Gomez - 6/10/2026, 5:22:00 PM

1. 

****Retest date****: 2026-06-10
****Environment****: staging ([https://staging-upexbunkai.vercel.app](https://staging-upexbunkai.vercel.app/))
****Tester****: qa-headless@bunkai.io

1. 

1. 

- POST /workspaces/dfdd3fb7.../invites {email:"qa-headless@bunkai.io", role:"member"} → 409 ✓
- Error code: conflict, reason: email*already*member ✓

1. 

---

### Ely - 6/25/2026, 9:00:19 PM

## 🤖 Curación de campos QA (estándar Bunkai)

Curación automática de campos QA según el estándar Bunkai. Justificación:

| ***Campo**** | ****Valor aplicado**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Tenancy & Identity | El defecto vive en el flujo de invitaciones a workspace (`POST /invites`), parte del dominio de Identidad y Tenencia. El Epic original ([https://jira.upexgalaxy.com/browse/BK-1#icft=BK-1](https://jira.upexgalaxy.com/browse/BK-1#icft=BK-1)) mapea a este componente. |
| Epic padre | BK-183 (Defect Management) | Reparentado: todos los defectos se consolidan bajo el epic de gestión de defectos. |
| Test Environment | Staging | Hallazgo reportado en staging (sprint-testing [https://jira.upexgalaxy.com/browse/BK-5#icft=BK-5](https://jira.upexgalaxy.com/browse/BK-5#icft=BK-5), 2026-06-05). |
| Severity | Crítica | Brecha de límite de seguridad: miembros reciben tokens de invitación duplicados con posible escalada de privilegios. Bloquea el sign-off de QA. |
| Priority | Highest | Alineada a Severity Crítica. |
| Error Type | Functional | Validación funcional ausente (no se devuelve 409 según FR-003). |
| Root Cause | Code Error | Causa establecida en el ticket: falta la consulta de unicidad contra `workspace_members` antes de insertar la invitación en `route.ts`. |

Ningún campo quedó en blanco.

---


_Synced from Jira by sync-jira-issues_
