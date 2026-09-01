<!--
TEMPLATE: srs-lite.md (Lite lane requirements spine — WORKFLOW § Lanes)
Used by: step 1.5-lite (written), 1.9-lite (feature table frozen by owner ack),
  2.1 ERD, 2.3 build-manifest compilation.
Role: BA (Lite lane). Replaces: gap-analysis + full SRS + CLARIFICATIONS +
  VISION/use-cases/RTM for internal/small projects. GAP-NNN optional — the
  token chain may start at REQ-ID (docs/about/TRACE_SPEC.md still governs grammar).
Output path: <project-root>/docs/requirements/srs-lite.md
Bilingual: INTERNAL — English only.
Shape-only scaffold. Replace <placeholders>.
-->

# SRS-Lite — <project>

> One-file requirements spine for the **Lite lane**. Every requirement carries a
> full-grammar **REQ-ID** (`MODULE.AREA.NN`); high-risk rows get scenarios; the
> feature table below IS the scope baseline frozen at 1.9-lite.

- **Date:** YYYY-MM-DD · **Owner:** <name> · **Lane:** Lite
- **Problem (3 lines max):** <who hurts, what the product does about it, what done looks like>
- **Actors / roles:** <e.g. admin, member> (RPM at `docs/visuals/diagrams/role-permission-matrix.md`, step 1.11)

## Modules

| Module | Abbrev | One-liner |
|---|---|---|
| <Infrastructure/auth> | `IF` | <login, roles, settings> |
| <Domain module> | `<XX>` | <what it covers> |

## Requirements *(the spine — one row per requirement)*

Columns: REQ-ID (full grammar) · Requirement (one **shall** sentence) · MoSCoW ·
High-risk? (money / auth / async / destructive → needs SC or recorded skip) ·
Acceptance (one observable check).

| REQ-ID | Requirement | MoSCoW | High-risk? | Acceptance |
|---|---|---|---|---|
| `IF.AUTH.01` | The system shall <…> | M | yes — auth | <actor does X → sees Y> |
| `<XX.AREA.01>` | The system shall <…> | M | no | <…> |

### High-risk scenario coverage

| REQ-ID | SC-NNN / skip |
|---|---|
| `IF.AUTH.01` | `SC-001` (`docs/requirements/scenarios/<file>.md`) — or `skip: <reason>` |

## Feature table *(scope baseline — frozen at 1.9-lite)*

| Feature | REQ-IDs | MoSCoW | In scope? |
|---|---|---|---|
| <feature name> | `IF.AUTH.01`, `<XX.AREA.01>` | M | yes |
| <deferred feature> | — | C | **no** — <reason> |

## NFR one-liners

- **Performance:** <e.g. p95 < 500ms on list endpoints at 100 concurrent users — or "no explicit target">
- **Security:** <authn/authz baseline, data sensitivity, secrets policy>
- **Availability / backup:** <expectation + backup cadence>
- **Compliance / data residency:** <requirement or `N/A by decision (YYYY-MM-DD)`>
- **Browser/device targets:** <…>

## Open questions

| # | Question | Blocks scope? | Answer / deferred |
|---|---|---|---|
| 1 | <…> | yes/no | <…> |

## Freeze *(1.9-lite — PB-G2 owner ack)*

```text
Scope frozen (Lite lane)
Owner ack: <name> — "<one-line written ack>"   on YYYY-MM-DD
Out of scope confirmed: <list or none>
```
