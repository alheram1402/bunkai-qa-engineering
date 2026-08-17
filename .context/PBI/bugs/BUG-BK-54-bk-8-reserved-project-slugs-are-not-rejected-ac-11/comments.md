# Comments for BK-54

[View in Jira](https://jira.upexgalaxy.com/browse/BK-54)

---

### Ely - 6/10/2026, 10:52:09 AM

## 🔗 Duplicate Bug Resolution

This issue is a ***duplicate**** of ****BK-51***.

### Analysis

- Identical summary and scope as [https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51](https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51) — both rows were created twice during the [https://jira.upexgalaxy.com/browse/BK-8#icft=BK-8](https://jira.upexgalaxy.com/browse/BK-8#icft=BK-8) exploratory-testing batch.
- Same root cause; the fix will be tracked and verified on [https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51](https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51).

### Action Taken

- Linked to [https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51](https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51) (Duplicate) and closed as Duplicated.

***Note:*** progress and QA verification tracked on [https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51](https://jira.upexgalaxy.com/browse/BK-51#icft=BK-51).

---

### Automation for Jira - 6/10/2026, 10:52:14 AM

Hola Ely!
Este reporte es idéntico a otro reporte de incidencia de la misma US.
Toma en cuenta que cada reporter de defecto/bug debe ser independiente y único. No podemos trabajar en más de 1 defecto cuya incidencia es la misma pero con datos diferentes. Es mejor juntar todos los defectos en un mismo reporte por cada única funcionalidad.
Por lo tanto, éste reporte se considera DUPLICADO, y para no trabajar en 2 incidencias iguales, vamos a considerar una (la primera que se creó) para trabajar cómodamente.
Para cualquier duda, escríbenos por Slack! 🕵🏻‍♂️

---

### Ely - 6/25/2026, 8:59:28 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | Falta validación de slugs reservados en la ruta de creación de proyectos. Tenía Epic Link [https://jira.upexgalaxy.com/browse/BK-7#icft=BK-7](https://jira.upexgalaxy.com/browse/BK-7#icft=BK-7) (Project & Module Hierarchy) → mismo componente por el mapa épica→componente. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado desde [https://jira.upexgalaxy.com/browse/BK-7#icft=BK-7](https://jira.upexgalaxy.com/browse/BK-7#icft=BK-7) al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Ya marcado Staging; confirmado, reproducido en `staging-upexbunkai.vercel.app`. |
| Severity | Mayor | Slugs reservados colisionan con rutas de Next.js; AC-11 falla. Valor previo correcto, reafirmado. |
| Priority | High | Alineada a Severity Mayor. |
| Error Type | Functional | Validación ausente. Valor previo correcto, reafirmado. |
| Root Cause | Code Error | Guarda de slug reservado sólo en ruta de workspaces; `SLUG*RESERVED` ausente de `API*ERROR_CODES`. Confirmado en código. |
| Nota | Duplicado | Este ítem está marcado como Duplicado; campos curados igualmente para consistencia del heatmap. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---


_Synced from Jira by sync-jira-issues_
