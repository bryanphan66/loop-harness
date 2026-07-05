# Templates

Shape-only scaffolds for the artifacts the harness expects across the **3 macro
stages** (Pre-Build / Build & Go-live / Post-Build). Copy or stub into the
project repo when the corresponding `docs/WORKFLOW.md` step is reached.

Each template starts with an HTML header comment citing **which step + gate** it
serves, its **role + engine**, its **output path**, and its **bilingual** status.
The default templates are English; **client-facing** templates have Vietnamese
forks under `locale-vi/` (D4 — owned by a separate agent). Tokens, IDs, paths,
and code fences stay English even inside a VN fork.

**Token grammar (D3 — the only scheme):** `REQ-ID = MODULE.AREA.NN` (e.g.
`IF.AUTH.01`) · `SC-NNN` · `TC-NNN` · `GAP-NNN` · `CR-NN`. Do **not** use
`US-NNN.REQ-MMM`. Full chain: `docs/TRACE_SPEC.md`.

## Index

### Pre-Build — commercial & BA spine

| File | Step | Gate | locale-vi fork? | Notes |
| --- | --- | --- | --- | --- |
| [client-intake-brief.md](client-intake-brief.md) | 1.2 | PB-G1 (internal capture) | **yes** | Vendor-internal go/no-go. Red/green flags, complexity, conditional probes, decline reply. |
| [gap-analysis.md](gap-analysis.md) | 1.4 | feeds PB-G2 | **yes** | As-Is/To-Be + 6 gap categories + MoSCoW. Mints `GAP-NNN` → `REQ-ID`. |
| [srs-lite.md](srs-lite.md) | 1.5-lite (Lite lane) | PB-G2 owner ack (1.9-lite) | no (internal) | One-file requirements spine: modules + `REQ-ID` table + high-risk flags + feature table + NFR one-liners. Replaces 1.3–1.9 in the Lite lane (`docs/WORKFLOW.md` § Lanes). |
| [feature-register.md](feature-register.md) | 1.9 | **PB-G2 (CLIENT)** scope frozen | **yes** | Scope baseline. Columns: scope-group, module/use-case, feature, `in-MVP`/`defer`/`needs-consult`/`out`, `REQ-ID`, `GAP` ref. RTM backward-complete on freeze. |
| [role-permission-matrix.md](role-permission-matrix.md) | 1.11 | RPM coverage; re-checked at ACCEPTANCE | **yes** | Roles × resources × CRUD grid. Every non-`N` cell cites a `REQ-ID`. |
| [status-flow.md](status-flow.md) | 1.11 | status-flow coverage; re-checked at ACCEPTANCE | **yes** | Per-entity Mermaid state machine + transition table. Every transition cites a `REQ-ID`. |
| [proposal-sow.md](proposal-sow.md) | 1.14 → 1.15 | **PB-G4 (CLIENT)** contract + deposit | **yes** | EN SOW; pairs with the VN `docs/bao-gia/` set. Every § 4 line ↔ 1 feature-register line. PROTOTYPE-THEN-QUOTE. |

### Build & Go-live + Post-Build

| File | Step | Gate | locale-vi fork? | Notes |
| --- | --- | --- | --- | --- |
| [spec-intake.md](spec-intake.md) | Build entry | DoR inputs | no (internal) | Turns the signed BA spine into ERD/stack questions. Carries conditional enterprise triggers. |
| [build-manifest.md](build-manifest.md) | 2.3 | **DoR** (coverage: every in-scope `REQ-ID` in exactly one phase, P0 defined) | no (internal) | Ordered executable phases P0..PN — the spec→code conversion layer `/build-phase` executes. Playbook: `build-manifest-compilation.md`. |
| [story.md](story.md) | 2.6 | verify-gate / DoD | no (internal) | FLAT `<module>-NN-<slug>.md`. Realises `REQ-ID`s; commits cite ≥1 token; tests mint `TC-NNN`. Implementation guardrails. |
| [validation-report.md](validation-report.md) | 2.8 → 2.10 | DoD | no (internal) | `REQ-ID` × `TC-NNN` coverage + layer results. Feeds the verification register the verify-gate parses. |
| [release-note.md](release-note.md) | 2.13 | release smoke | **yes** | Every released `REQ-ID` appears; each cites the `TC-NNN` that proved it. Pre/post-deploy smoke + rollback + client update. |
| [change-request-log.md](change-request-log.md) | 3.5 (always-on) | impact + approval before code | **yes** | Mints `CR-NN`; approved CRs mint new `REQ-ID`s re-entering the chain. Classification, severity, 5 reply templates. |
| [maintenance-proposal.md](maintenance-proposal.md) | 3.4 | tier proposed | **yes** | SLA tiers (Basic/Standard/Premium), severity, scope in/out, SLA exclusions. SLA terms hypercare (3.2) depends on. |

### Living trackers — whole-project state (internal)

Updated in every stage-boundary commit; never derived once. English-only.

| File | When | locale-vi fork? | Notes |
| --- | --- | --- | --- |
| [STAGE.md](STAGE.md) | Bootstrap → all steps | no | Single-glance current-step pointer for the 3-macro model: Snapshot / History / Pending (full route across all 3 macros, conditional gates marked N/A-by-decision). Copied to the project **repo root**. |
| [ROADMAP.md](ROADMAP.md) | Skeleton at PB-G4; enriched in Build | no | Module / milestone / timeline / %. Dates mirror the SOW; shifts flow via `CR-NN`. Lands at `docs/ROADMAP.md`. |

### Audit & project-doc stubs (internal)

| File | When | locale-vi fork? | Notes |
| --- | --- | --- | --- |
| [decision.md](decision.md) | Always-on (key: 2.1 ERD, 2.2 stack/threat-model) | no | ADR shape. Filename is a **stable slug**, never a number. Referenced by slug elsewhere. |
| [code-standards.md](code-standards.md) | 2.2 (after stack-selection) | no | One-page conventions keyed to the stack-selection decision (by slug). Lands at `docs/code-standards.md`. |
| [deployment-guide.md](deployment-guide.md) | 2.4 seeds → 2.13 finalize | no | Environments + env vars + build + deploy + rollback + observability/SLO + conditional DR/RTO-RPO + runbook. Lands at `docs/deployment-guide.md`. |

## Bilingual Surfaces (D4)

`locale-vi/` forks exist for **all client-facing surfaces** (owned by a separate
agent): `client-intake-brief`, `gap-analysis`, `feature-register`, `proposal-sow`
(+ the VN `bao-gia/` set), `role-permission-matrix`, `status-flow`,
`change-request-log`, `release-note`, `maintenance-proposal`, plus handover docs
and the user-guide. **Internal technical** artifacts stay English: `spec-intake`,
`story`, `validation-report`, `decision`, `code-standards`, `deployment-guide`,
`STAGE.md`, `ROADMAP.md`, plus SRS / playbooks / `AGENTS.md` / `WORKFLOW.md` /
`TRACE_SPEC.md`. IDs, paths, tokens, and code fences stay EN even inside VN files.

## Adding A New Template

1. Decide the group (Pre-Build commercial / Build-Go-live / trackers / stubs) and
   place it under that section.
2. Add the **HTML header comment**: which step + gate, role + engine, output
   path, bilingual status, token-grammar note.
3. Keep templates **shape**, not **content** — `<placeholders>` and `YYYY-MM-DD`,
   no project-specific data. Apply the D3 token grammar in any ID examples.
4. Update this README's index in the same commit.
5. If client-facing, fork to `locale-vi/` per D4 (coordinate with the VN owner).
6. Keep each template focused and reasonably small (< ~200 lines where it fits).

## Cross-References

- 3-macro step tables + gates: `docs/WORKFLOW.md`.
- Token grammar + RTM rule: `docs/TRACE_SPEC.md`.
- Role → agent + engine binding: `docs/ROLE_MAP.md`.
- Docs crosswalk (which template backs which expected doc): `docs/README.md`.
- Per-project stage tracker lands at the project **repo root** as `STAGE.md`.
