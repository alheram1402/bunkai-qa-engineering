# Comments for BK-177

[View in Jira](https://jira.upexgalaxy.com/browse/BK-177)

---

### Benjamin Segovia - 6/23/2026, 4:03:57 PM

Smoke: staging /login renders the legacy magic-link-only screen, no password step



---

### Ely - 6/24/2026, 8:55:08 PM

@@Benjamin Segovia can you confirm me if this BUG was already tested? or not? Can we close this Bug Report? I can see the NEW email/password Workflow in the staging environment:





---

### Automation for Jira - 6/24/2026, 8:56:20 PM

Hola Benjamin Segovia!
Este reporte no es válido de acuerdo a los requerimientos de la US.
Por favor vuelve a chequear y cualquier duda, nos lo haces saber por Slack! 🕵🏻‍♂️

---

### Ely - 6/25/2026, 8:59:44 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Tenancy & Identity | Defecto del flujo de autenticación (login email-first / rutas /api/v1/auth, historia [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166)). Sin Epic Link previo: inferido del contenido. |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado a gestión de defectos. |
| Entorno de prueba | Staging | Indicado en la descripción. |
| Severidad | Crítica | Conservada. Bloquea por completo la QA de [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166): la feature de sign-in con contraseña es inalcanzable y 0/42 outlines pudieron ejecutarse; es el primer gate de identidad (CRITICAL en el master test plan). |
| Prioridad | Highest | Alineada a Severidad Crítica. |
| Tipo de error | Integration | Conservado. La discrepancia es entre el código mergeado (PR #54) y lo que sirve el entorno desplegado. |
| Causa raíz | Working As Designed (WAD) | Conservada. El análisis concluye que NO es defecto de lógica de la app sino alias obsoleto / build fallido en Vercel; el ticket fue REJECTED. Valor preexistente coherente con la resolución. |

---

### Benjamin Segovia - 7/8/2026, 6:01:55 PM

## QA Retest — Confirmed

Retested on ***staging*** (`https://staging-upexbunkai.vercel.app/login`) on 2026-07-08.

- `/login` now renders the ***email-first sign-in flow***: email field → `Continue` → password step, matching the acceptance criteria in [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166) ("Email-first detection routes an existing account to the password step").
- The magic-link option ("Email me a link instead") is still present as a secondary fallback, per AC "The magic-link fallback stays available on the login screen".
- Wrong-password submission correctly shows "That email or password is incorrect." (matches AC "Sign in with a wrong password is rejected").

The original defect (legacy magic-link-only screen, no password step) is ***no longer reproducible***. This confirms Ely's observation in the thread above.

Ticket is already in status ***Rechazado*** (rejected as invalid per US requirements) — no further transition needed. Leaving this confirmation for traceability.

---


_Synced from Jira by sync-jira-issues_
