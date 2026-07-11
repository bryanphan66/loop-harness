# Playbooks

Playbooks capture **reusable agent experience** — concrete, runnable recipes for
the steps of the 3-macro delivery flow (`docs/WORKFLOW.md`). Read the matching
playbook before re-deriving a step; add to the folder whenever a recipe is
non-obvious and likely to recur.

**Authority:** `docs/WORKFLOW.md` step tables + the locked decisions D1–D6
(`docs/HARNESS.md` § Locked Decisions).
Every playbook obeys the **Independence Principle** (`docs/HARNESS.md` § D1): each
names a `ck-*` skill as its **Engine** fast path, and a bare-agent fallback that
produces the same artifact shape. The skill is an accelerator, never a hard
requirement.

## Coverage

Playbooks exist for all three macro-stages and are executable as written. The
map (`docs/WORKFLOW.md`) is authoritative for step order and gates; each
playbook owns its step's recipe.

## Lifecycle

Each playbook carries a grep-able `**Lifecycle:**` line (`experimental` /
`verified` / `deprecated`) per `docs/HARNESS.md` § Playbook Lifecycle. All
playbooks here ship `experimental` (not yet exercised on a real step). Promotion to
`verified` happens via `session-retrospective.md`.

## Tokens (D3 — the only scheme)

REQ-ID `MODULE.AREA.NN` (e.g. `IF.AUTH.01`) · `SC-NNN` · `TC-NNN` · `GAP-NNN` ·
`CR-NN`. Chain: business problem → `GAP-NNN` → REQ-ID → use-case + RTM row →
`SC-NNN` → feature-register line → SOW line → `TC-NNN` → UAT → release → handover.
**`US-NNN.REQ-MMM` is NOT used.** Full grammar: `docs/TRACE_SPEC.md`.

## Use Order

1. Read `STAGE.md` → find the current macro-stage + step.
2. Open the playbook that **owns that step** (the index below maps step → file).
3. Follow it; use the Engine fast path if the `ck-*` skill is present (preflight
   passed), else the bare-agent fallback.
4. If a fix fails or partially works, append a **Variant** section (never delete
   the original shape).
5. If no playbook matches and the step is reusable, add one from `template.md`.

## Index — By Macro-Stage

### Meta / always-on

| File | Owns | One-line |
|---|---|---|
| [solo-dev-client-delivery.md](solo-dev-client-delivery.md) | the whole flow | Meta-playbook mapping the 3 macro-stages onto harness artifacts. Pointers only; composes, never duplicates. |
| [bilingual-delivery-template-pattern.md](bilingual-delivery-template-pattern.md) | D4 forks | `locale-vi/` fork pattern for all client-facing surfaces; IDs/paths/code stay EN. |
| [playbook-composition-pattern.md](playbook-composition-pattern.md) | authoring | When to wrap playbooks into a meta-playbook (and when NOT). Hand-off contract + freshness `.meta.json`. |
| [PATCH-EXTENSION-PROTOCOL.md](PATCH-EXTENSION-PROTOCOL.md) | org extension | Non-destructive `HARNESS:EXT` markers for org-local additions. Operating-model docs stay fork-not-patch. |
| [template.md](template.md) | new playbooks | Canonical shape for a new playbook (Engine + step + Variant). |
| [design-system-3-tier.md](design-system-3-tier.md) | cross-stage (1.10–1.12 + 2.6–2.10) | Owns 3-tier UI enforcement: Tier-1 floorplans/behavior (`docs/design-system/design-rules.md`), Tier-2 tokens + Tier-3 components (via `ui-design-system-contract.md`), screen-inventory classification (via `visual-and-behavioral-modeling.md` 1.11). HARD gate. |
| [session-retrospective.md](session-retrospective.md) | Post-Build 3.6 + always-on | End-of-session cross-task insight capture; promotes `experimental` playbooks to `verified`. |

### Macro-Stage 1 — Pre-Build *(built fully)*

| File | Owns | One-line |
|---|---|---|
| [discovery-interview-playbook.md](discovery-interview-playbook.md) | 1.3 | 5-persona × 3-mode interview → REQ candidates + decisions log + open questions. Engine `ck-rri`. |
| [gap-analysis.md](gap-analysis.md) | 1.4 | As-Is/To-Be MoSCoW; mints **GAP-NNN** (first token in the chain). Manual BA technique. |
| [ba-core-doc-bundle.md](ba-core-doc-bundle.md) | **1.7** | **The load-bearing checklist** — the 5 BA artifacts (VISION_SCOPE, USE_CASES, GLOSSARY bilingual, BPMN, RTM) + the **RTM completeness gate** (every feature → ≥1 REQ-ID + ≥1 use case). No single ck-skill owns it. |
| [scenario-taxonomy-playbook.md](scenario-taxonomy-playbook.md) | 1.8 | 12-dimension edge-case decomposition of high-risk REQ-IDs; mints **SC-NNN**. Engine `ck-scenario`. |
| [ui-design-system-contract.md](ui-design-system-contract.md) | 1.10 | Brand + design tokens (light/dark), code-is-SoT, Component Coverage Matrix. Engine `ck-design-system`. |
| [visual-and-behavioral-modeling.md](visual-and-behavioral-modeling.md) | 1.11 | Screen map / user flows / business workflows / ERD draft / RPM / status-flow. Engine `ck-ux-design`. |

> 1.1 capture (`ck-intake-file`), 1.5 SRS (`ck-xre EXTRACT`), 1.6 validate
> (`ck-xre VALIDATE`), 1.9 feature register (`ck-scope-package`) are skill-driven
> steps with no separate playbook; **1.12 prototype is built in an external design
> tool — Claude Design / Open Design / Google Stitch / Pencil.dev — not generated
> in Claude Code.** Their contract is the Output-path + token grammar in
> `docs/WORKFLOW.md`.

### Macro-Stage 2 — Build & Go-live

| File | Owns | One-line |
|---|---|---|
| [build-manifest-compilation.md](build-manifest-compilation.md) | 2.3 | Compile the frozen spec into `docs/build-manifest.md` (ordered phases P0..PN, coverage proof) — the spec→code conversion layer `/build-phase` executes. |
| [seed-data-pattern.md](seed-data-pattern.md) | 2.5 | Deterministic FK-valid demo data for DEV/TEST. Symbolic IDs, scoped cleanup, never production. Engine `ck-seed`. |
| [build-execution.md](build-execution.md) | 2.6 | Trunk-based branching, commit cadence, D3 token-citation commit-msg hook, pre-commit + secret-scan, `validate:quick`; **adopt-export-as-code Prototype→Code fidelity** (bring the export's CSS+kit+screens in verbatim, NOT re-draw; fidelity assertions + glance), systemic-fix full-sweep rule, late PUB product-shot capture. Engine `cook`. |
| [prototype-export-adoption.md](prototype-export-adoption.md) | 2.6 (per UI phase) | Turn a frozen Claude-Design export into faithful UI by **adopting its code** — copy `tokens.css`/`components.css` in, port `kit.jsx` KEEPING classNames, rebuild screens from `screens-*.jsx`, wire only real data (~99% by construction vs ~80% re-draw). Fallback = design-system build when no export. Engine `frontend-development` · `ui-styling`. |
| [payment-integration.md](payment-integration.md) | 2.6 (if money) | Webhook idempotency + signature verify + refund/dispute + reconciliation + PCI SAQ-A + 7-yr audit. Engine `ck-payment-integration`. |
| [async-job-queue.md](async-job-queue.md) | 2.6 (`Phase-type: async-job`) | BullMQ+Redis background jobs (transcode / PDF-render / email-blast). Categories: idempotency-key · retry/backoff + dead-letter · status-polling API · failure surfaces real cause. Tier-2 `apps/api/src/common/queue/` + `apps/worker/`. Engine `backend-development`. |
| [object-storage.md](object-storage.md) | 2.6 (`Phase-type: storage`) | S3/R2 adapter primitive (uploads / PDFs / attachments). Categories: signed PUT/GET · entitlement (unauth GET denied) · cleanup-on-delete · quota · minio local parity. Tier-2 `apps/api/src/common/storage/`. Engine `backend-development` · `devops`. |
| [media-pipeline.md](media-pipeline.md) | 2.6 (`Phase-type: media-pipeline`) | Composes async-job + object-storage + ffmpeg: large upload → HLS multi-bitrate (480/720/1080) → signed-URL/CDN player. Categories: resumable upload · transcode atomicity + ladder · signed manifest · progress · cleanup; streaming NFR at-phase. Engine `media-processing`. |
| [external-integration.md](external-integration.md) | 2.6 (`Phase-type: external-integration`) | Generic 3rd-party (SES/Zalo/webhook). Categories: credential resolution (sandbox vs prod) · webhook signature verify · idempotent webhook handling · retry + provider-error surfaced · adapter abstraction. Generalizes payment-integration's webhook rigor. Engine `backend-development`. |
| [code-review-scoring.md](code-review-scoring.md) | 2.7 | 6-dim rubric (correctness 3 / security 2 / quality 2 / perf 1 / maint 1 / tests 1); pass ≥7, any 0 auto-blocks; floor rules: design-system, visual fidelity, no generic error-swallow; systemic-pattern sweep. Engine `ck-code-review`. |
| [canonical-e2e-flow-playbook.md](canonical-e2e-flow-playbook.md) | 2.8 | Phase-typed E2E (form / workflow / readonly / mixed) from BA acceptance criteria; mints **TC-NNN**; Mandatory Coverage Rules: negative-path for every failable op (real cause surfaces) + every auth method login→data-load + cookie hygiene. Engine `ck-e2e-flow`. |
| [e2e-qa-field-by-field-verify-with-report.md](e2e-qa-field-by-field-verify-with-report.md) | 2.10 | Field-by-field verify + `correct/incorrect/manual/not-found` report + user-guide video → DoD evidence. Engine `ck-qa`. |

### Macro-Stage 3 — Post-Build

Post-Build steps (3.1 handover `ck-handover`, 3.2 hypercare `ck-hypercare`, 3.4
maintenance proposal, 3.5 change-control `ck-xre CHANGE-REQUEST`) are
skill-driven with goal blocks in `docs/STAGE_GOALS.md` + templates under
`docs/templates/` (closure stories, maintenance-proposal, change-request-log).
`session-retrospective.md` (3.6) is listed under always-on.

## Cross-Project Use

This folder ships with the harness; any project that runs
`scripts/install-harness.sh` gets the same playbooks. Treat each entry as
**portable knowledge** — no project-specific paths, env values, or secrets in
playbook bodies. Use placeholders (`<project-root>`, `<module>`). Playbooks stay
**English** (agent-facing, D4); only client-facing templates fork to `locale-vi/`.
