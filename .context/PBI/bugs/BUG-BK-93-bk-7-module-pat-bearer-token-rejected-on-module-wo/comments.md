# Comments for BK-93

[View in Jira](https://jira.upexgalaxy.com/browse/BK-93)

---

### Jorgelina Abdo - 6/8/2026, 3:33:07 AM

Bug found during exploratory testing of [https://jira.upexgalaxy.com/browse/BK-10#icft=BK-10](https://jira.upexgalaxy.com/browse/BK-10#icft=BK-10) (TC-I04 — PAT bearer token rejected on module/workspace endpoints). Story: [https://upexgalaxy69.atlassian.net/browse/BK-10](https://jira.upexgalaxy.com/browse/BK-10)

---

### Ely - 6/10/2026, 10:50:26 AM

## 🔗 Duplicate Bug Resolution

This issue is a ***duplicate**** of ****BK-84***.

### Analysis

- Both describe: a valid PAT bearer (`bk*pat**`) rejected with `401 unauthorized` on module/workspace member-resource endpoints while /me + /workspaces work.
- Same root cause: pre-ADR-0001, ~29 handlers used the cookie-only `createClient().auth.getUser()` and ignored the Authorization header. Fixed structurally by commit `226fc9d` (unified auth gateway) and live-verified on staging 2026-06-10 — full evidence on [https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84](https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84).
- [https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84](https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84) status: Ready For QA.

### Action Taken

- Linked to [https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84](https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84) (Duplicate) and closed as Duplicated.

***Note:*** progress and QA verification tracked on [https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84](https://jira.upexgalaxy.com/browse/BK-84#icft=BK-84).

---

### Automation for Jira - 6/10/2026, 10:50:30 AM

Hola Jorgelina Abdo!
Este reporte es idéntico a otro reporte de incidencia de la misma US.
Toma en cuenta que cada reporter de defecto/bug debe ser independiente y único. No podemos trabajar en más de 1 defecto cuya incidencia es la misma pero con datos diferentes. Es mejor juntar todos los defectos en un mismo reporte por cada única funcionalidad.
Por lo tanto, éste reporte se considera DUPLICADO, y para no trabajar en 2 incidencias iguales, vamos a considerar una (la primera que se creó) para trabajar cómodamente.
Para cualquier duda, escríbenos por Slack! 🕵🏻‍♂️

---

### Ely - 6/25/2026, 9:01:04 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componentes | Tenancy & Identity · Project & Module Hierarchy | El defecto cruza dos módulos: el PAT (autenticación headless) no es honrado, y los endpoints afectados son módulos y workspaces. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Severidad | Moderada | Funcionalidad degradada para agentes/CLI, pero existe workaround vía sesión por cookie. |
| Prioridad | Medium | Alineada a severidad Moderada. |
| Tipo de error | Functional | Un token válido es rechazado con 401: comportamiento funcional incorrecto del auth, no una vulnerabilidad. |
| Causa raíz | Code Error | El texto establece que los endpoints de recurso solo aceptan auth por cookie y no procesan el Bearer PAT (gap en el código de autenticación). |
| Entorno | Staging | Reproducido en staging-upexbunkai.vercel.app. |
| Frecuencia | (sin cambios) | Campo no tocado por política. |

---


_Synced from Jira by sync-jira-issues_
