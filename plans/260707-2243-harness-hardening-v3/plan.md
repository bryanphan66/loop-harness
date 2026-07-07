# Harness Hardening v3 — bake auto-script UAT lessons into gates

**Trigger:** auto-script Macro-2 run produced a working app but needed a long manual UAT-fix loop. 5 blind spots surfaced — all "gates checked the wrong thing". Operator decision 2026-07-07: harden harness BEFORE running the next big project (Nhất Nghệ).

**Scope:** edit `~/Desktop/Workspace/videcode-harness/harness/` only (docs/playbooks/gates/STAGE_GOALS/build-manifest template + WORKFLOW). NO app code. Evidence to read: `plans/reports/autoscript-*` (ui-port, otp-auth-fix, systemic-tier-model-fix, uat-fix-round*) + `plans/260706-0813-autoscript-macro2-build/plan.md` § UAT iteration log + § Harness blind spots.

## The 5 blind spots → concrete harness changes

### BS1 — No visual-fidelity gate for APP/ADM vs prototype (biggest)
Root: build-execution playbook says APP/ADM = "rebuild via design-system, not pixel-port"; gates only check floorplan classification + token usage → a plain-but-correct app passes 2.7/2.10/2.12 while looking nothing like the design-heavy mockup.
Fix:
- **Flip the default for design-heavy products**: `playbooks/build-execution.md` § Prototype → Code Fidelity — APP/ADM should **PORT the Claude Design export markup/CSS as the primary reference** (reconciled to Tier-2 tokens), NOT rebuild-from-spec. The export IS the implementation reference. Deviation requires a recorded `docs/decisions/<slug>.md`.
- **New gate: VISUAL FIDELITY** — add to `docs/gates/dod-build.md` + a 2.10 QA sub-step in STAGE_GOALS: for each key APP/ADM screen, screenshot the running app and compare side-by-side to the prototype export render; a screen structurally/visually far from the mockup = block. Add as a 2.7 code-review floor rule too (like design-system-compliance).
- WORKFLOW.md 2.6/2.10 + Canonical Gate List updated.

### BS2 — Error swallowing; e2e only happy-path
Root: real errors (tier gate, quota) surfaced as generic "đã có lỗi"; 2.8 e2e never exercised failure.
Fix:
- `playbooks/canonical-e2e-flow-playbook.md` + STAGE_GOALS 2.8: every user-facing operation that can fail (AI-gen, tier/quota-gated, payment) MUST have a negative-path e2e that triggers the failure and asserts the REAL cause surfaces to UI (no generic message). Add "no generic error-swallow" as a 2.7 review floor rule.

### BS3 — Fix-one-miss-the-rest (no cross-pattern sweep)
Root: fixing script-gen left brand/idea broken (same model-tier pattern).
Fix:
- `playbooks/code-review-scoring.md` + `build-execution.md`: when a change fixes a systemic pattern (error handling, model/tier resolution, auth, quota), the author/reviewer MUST grep ALL call-sites of that pattern and confirm every sibling is covered. A fix leaving sibling sites broken = automatic review finding. Prefer a single chokepoint over per-feature patches (DRY).

### BS4 — Auth methods not tested to data-load
Root: OTP/admin login + cookie split-brain only caught in manual UAT; e2e stopped at "reached dashboard".
Fix:
- `canonical-e2e-flow-playbook.md` + STAGE_GOALS 2.8: for EVERY auth method (OAuth, OTP/passwordless, admin), an e2e that logs in AND loads real authenticated data (200, not just route-reached), PLUS a "switch auth method on same browser" cookie-hygiene case. Add a `playbooks/` note on single cookie-scope authority (one writer, one scope) to avoid split-brain.

### BS5 — Landing/PUB product images captured before APP screens final
Root: hero/feature shots taken off the early flat UI → stale after APP port.
Fix:
- `build-execution.md` § Prototype → Code Fidelity + build-manifest template: PUB product-shot capture is a LATE phase, sequenced AFTER APP screens are built+styled (or a 2.10 sub-step). Manifest must order the PUB-capture phase to depend on the APP screen phases.

### Meta — build-manifest completeness
- `docs/templates/build-manifest.md`: each screen phase must cite its prototype export source file + require a fidelity check; add an explicit "port from export" vs "rebuild (recorded decision)" column.

## Deliverables
1. Edits across `harness/` per BS1–BS5 + meta, cross-references consistent (grep pass: no dangling refs).
2. New gate doc `docs/gates/visual-fidelity.md`; Canonical Gate List + DoD updated.
3. Bump a HARNESS_VERSION note / changelog line documenting v3 hardening + which blind spots each change closes.
4. Report `plans/reports/harness-hardening-v3-report.md` (per-BS: what changed, which files).

## Success criteria
- `grep -rn "rebuild via design-system" harness/` no longer implies APP skips fidelity; the port-first rule + visual-fidelity gate are in place.
- Every new gate/rule traces to a specific auto-script failure (cite it).
- No app code touched; harness stays project-agnostic (Independence Principle intact).

## Then (next, after this)
Run Nhất Nghệ: Macro 1 (prototype v3 in Claude Design — confirm freeze) → Macro 2 on the hardened harness. Expect far fewer UAT-fix rounds.
