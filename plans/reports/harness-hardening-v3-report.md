# Harness Hardening v3 — report

Date: 2026-07-07 · Plan: `plans/260707-2243-harness-hardening-v3/plan.md` · Scope: `harness/` only (no app code, no auto-script, no stack template). Independence Principle intact (no new ck-* hard deps). All rules project-agnostic; auto-script cited only as failure evidence.

## Per-blind-spot changes

### BS1 — Visual fidelity (biggest)
Evidence: `plans/reports/autoscript-ui-port-summary.md` (operator rejected design-system rebuild of APP screens; re-ported Claude Design v3 export) + macro2 plan § blind spot #1/#2 (brand tokens shipped as scaffold zinc — classification passed, values wrong).
- `playbooks/build-execution.md` § Prototype → Code Fidelity **rewritten**: default flipped — APP/ADM **PORT the export** (markup/structure/styles reconciled to Tier-2 tokens, real data wired into ported structure), NOT rebuild-from-spec. Rebuild allowed only with `docs/decisions/<slug>.md`; per-screen `port from export | rebuild (decision: <slug>)` marker. Old rule quoted as failure evidence. § Before Coding A Screen: export source file = mandatory input (missing = blocker).
- **New gate `docs/gates/visual-fidelity.md`**: per-screen side-by-side (running-app screenshot vs export render), verdict rubric (structure / token values / states; content may change, shape may not), auto-block rule (divergent, no citation+no decision, missing rows), sign-off block. Catches value-level token drift too.
- Wired: 2.6 self-check (STAGE_GOALS 2.6 + `/build-phase` prompt), 2.7 floor rule (`code-review-scoring.md` + STAGE_GOALS 2.7), 2.10 evidence pass (STAGE_GOALS 2.10 + e2e-qa playbook Related), DoD line + sign-off row (`dod-build.md`), WORKFLOW rows 2.6/2.7/2.10 + new floor-rules note + **Canonical Gate List row "Visual Fidelity"**, gates/README index + note, gate-check DoD row.

### BS2 — Error swallowing / happy-path-only e2e
Evidence: `plans/reports/autoscript-systemic-tier-model-fix.md` (tier-gate error → generic "đã có lỗi"), ui-port summary (script-gen error surfacing fix).
- `playbooks/canonical-e2e-flow-playbook.md` **new § Mandatory Coverage Rules, rule 1**: every failable user-facing op (AI-gen, tier/quota, payment, provider, permission) needs ≥1 negative-path e2e triggering the failure and asserting the REAL cause surfaces (asserting a generic string = proving the swallow). Pseudo-skeleton TC-021 added.
- "No generic error-swallow" = 2.7 **floor rule** (`code-review-scoring.md`) + build-execution guardrail + STAGE_GOALS 2.7/2.8 + WORKFLOW 2.8 gate cell + DoD E2E line.

### BS3 — Fix-one-miss-the-rest
Evidence: `plans/reports/autoscript-systemic-tier-model-fix.md` (script-gen patched, brand/idea siblings left broken; fixed later via single chokepoint `resolveTierValidModel`).
- `code-review-scoring.md` **systemic-pattern sweep rule**: reviewer greps all call-sites of the fixed pattern; siblings left broken = automatic finding (Correctness capped at 1); prefer single chokepoint (Quality-scored).
- `build-execution.md` guardrail: author sweeps before review; `/build-phase` prompt carries the same rule.

### BS4 — Auth not tested to data-load
Evidence: `plans/reports/autoscript-otp-dashboard-auth-fix.md` (OTP login → dashboard all cards Unauthorized; split-brain cookie scopes; e2e stopped at "reached dashboard").
- canonical-e2e § Mandatory Coverage Rules, **rule 2**: EVERY auth method gets an e2e login → real authenticated data loads (200 + rendered values; route-reached ≠ proof), + one switch-auth-method-same-browser cookie-hygiene case per app.
- **Single cookie-scope authority note** (one writer, one scope; if two scopes unavoidable → purge ancestor scopes on set/clear + last-set-wins read) in same section.
- STAGE_GOALS 2.8 + WORKFLOW 2.8 + DoD E2E line + gate-check DoD row reference the rules.

### BS5 — Stale PUB product-shots
Evidence: `plans/reports/autoscript-uat-fix-round1-summary.md` U1 + landing-image-refresh (hero/feature shots from early flat UI, re-captured after port).
- `build-execution.md` **new § PUB product-shot capture is a LATE phase**: capture from running app only after depicted APP screens are built+styled+fidelity-checked; commit capture script.
- `templates/build-manifest.md`: late-phase rule comment + coverage checklist line (capture phase depends on every APP screen phase it depicts); `build-manifest-compilation.md` step 5 + `dor-build.md` new line; STAGE_GOALS 2.3 + 2.10.

### Meta — build-manifest completeness
- `templates/build-manifest.md` phase block: Screens line now = name · floorplan · **export source file** · **fidelity strategy** (port default / rebuild+ADR-must-exist); acceptance checks gain error-surfacing wording + visual-fidelity self-check item; coverage checklist gains export-citation + late-phase lines.
- `build-manifest-compilation.md`: export bundle added as frozen input #6.

### Version note
- New `docs/about/HARNESS_CHANGELOG.md` — v1 (import) / v2 (proof-run F1..F18) / v3 (this round, per-BS mapping). Referenced from `HARNESS.md` § Growth Rule. Current version: v3.

## Files changed (17)
- New: `harness/docs/gates/visual-fidelity.md`, `harness/docs/about/HARNESS_CHANGELOG.md`
- Modified: `build-execution.md`, `canonical-e2e-flow-playbook.md`, `code-review-scoring.md`, `build-manifest-compilation.md`, `e2e-qa-field-by-field-verify-with-report.md`, `playbooks/README.md`, `gates/{README,dod-build,dor-build}.md`, `STAGE_GOALS.md` (2.3/2.6/2.7/2.8/2.10), `WORKFLOW.md` (2.6–2.10 rows, floor-note, Canonical Gate List), `templates/build-manifest.md`, `HARNESS.md`, `.claude/commands/{build-phase,gate-check}.md`

## Verification
- `grep -rn "docs/build/" harness/` = 0 (pre-existing anti-pattern comment rephrased).
- All `docs/{gates,playbooks,templates}/*.md` paths referenced in harness resolve (scripted check, 0 missing).
- Old "rebuild via design-system" phrasing survives only as quoted failure evidence (build-execution + changelog).
- Scope check: only `harness/` touched (+ this report). Stack template untouched.

## Unresolved questions
- `/gate-check --gate` name list doesn't include a `VISUAL-FIDELITY` token — consistent with design-system-compliance (per-screen floor gates checked via 2.7/2.10, not standalone) — flag if operator wants it addressable directly.
- `scripts/harness-verify-gate.sh` has no mechanical half for visual fidelity (would need screenshot tooling); gate is judgment-half only for now, like most gate checklists.
