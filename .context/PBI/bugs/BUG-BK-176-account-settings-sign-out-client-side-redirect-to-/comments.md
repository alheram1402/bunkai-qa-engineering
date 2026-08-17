# Comments for BK-176

[View in Jira](https://jira.upexgalaxy.com/browse/BK-176)

---

### Andrés Daniel Cumare Morales - 6/23/2026, 3:33:54 AM

Bug found during exploratory testing of [https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86](https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86) (Account | View my identity, role, and sign out). Sign-out server-side invalidation works, but client-side redirect to /login does not fire.

---

### Ely - 6/25/2026, 8:59:43 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Account & Settings | El sign-out desde el menú de cuenta (AppSidebar) corresponde a cuenta/sesión del usuario. Historia relacionada [https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86](https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86). Sin Epic Link previo: inferido del contenido. |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado a gestión de defectos. |
| Entorno de prueba | Staging | Indicado en la descripción. |
| Severidad | Menor | La sesión SÍ se invalida server-side (204); solo falla el redirect visual. Impacto UX, no de seguridad ni funcional. |
| Prioridad | Low | Alineada a Severidad Menor. |
| Tipo de error | Functional | El redirect cliente a /login no se ejecuta tras el sign-out. |
| Causa raíz | EN BLANCO :flag_on: | El ticket solo plantea hipótesis ("race entre limpieza de cookie y navegación RSC", "router.refresh() podría cortocircuitar el push"). Sin evidencia concluyente del mecanismo exacto; se deja en blanco para no inventar. |

---

### Ely - 7/31/2026, 3:47:38 PM

## QA Handoff — [https://jira.upexgalaxy.com/browse/BK-176#icft=BK-176](https://jira.upexgalaxy.com/browse/BK-176#icft=BK-176)

Fixed and merged to `staging`: [PR #78](https://github.com/upex-galaxy/upex-bunkai-tms/pull/78), merge commit `5abf890`.

### Root cause

The `onAuthStateChange` listener fires in the SAME tab that called `signOut()`, and fires BEFORE that tab's own post-signOut redirect — supabase-js awaits every subscriber before `signOut()`'s own promise resolves. The listener was injecting a soft `router.replace('/login')`, which raced the initiating tab's own hard-navigation redirect and could silently fail to commit — matching the bug's exact symptom (page stays put, manual reload fixes it).

### Fix

`handleAuthChangeRedirect` now defaults to a real hard navigation (`window.location.assign`) instead of requiring an injected router callback. `auth-context.tsx` no longer wires `useRouter` into this listener. The pre-existing multi-tab sign-out behavior ([https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86](https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86)) is unchanged.

### Review

Independent adversarial review, 2 lenses (correctness/regression, security/session-hygiene): ***0 BLOCKER, 0 MAJOR***, 2 NIT (one dismissed as intentional defense-in-depth, one fixed). Full adjudication in the PR body.

### ⚠️ Flag for QA verification

> ***WARNING:*** This is a client-side navigation race. The regression test proves the DECISION (a hard navigation is called), but cannot prove browser-level navigation timing end-to-end — and this run's live-UI validation was suspended (batch-wide, not specific to this ticket). This bug class is a weaker fit for unit-test-only verification than most tickets in this batch.
Recommend a real two-tab manual check on staging: sign in on two tabs, sign out on one, confirm BOTH tabs redirect to `/login` immediately (no manual reload needed on either).

### Suggested re-check steps

1. Sign in to staging.
2. Open a second tab, same session.
3. Sign out from tab 1 via the account menu.
4. Confirm tab 1 redirects to `/login` immediately.
5. Confirm tab 2 also redirects to `/login` (without a manual refresh) shortly after — this is the pre-existing [https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86](https://jira.upexgalaxy.com/browse/BK-86#icft=BK-86) multi-tab behavior, unaffected by this fix but worth re-confirming alongside it.

---


_Synced from Jira by sync-jira-issues_
