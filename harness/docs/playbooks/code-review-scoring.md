# Code Review Scoring Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Six-dimension X/10 rubric with a pass/fail gate at ≥7. Applied per PR or per
> phase in Build. Owns Build & Go-live **step 2.7**.

**Macro-stage / step:** Build & Go-live · 2.7 (after 2.6 code, before 2.8 E2E).
**Gate:** score ≥7, no dimension = 0.

> **Increment note:** this playbook ships now but is *exercised* in the Build &
> Go-live macro-stage, whose detailed orchestration is built in the next
> increment. The rubric + gate below are authoritative.

## Engine

- **Fast path:** `ck-code-review` (evidence-based review of pending changes, a PR
  number, a commit hash, or a full codebase scan).
- **Role:** Tech Lead (wears the reviewer hat — D5; the same `planner`/SA agent
  must not self-review its own ERD work). **Bare-agent fallback:** the
  `code-reviewer` agent applies the 6-dim rubric by hand. Per D1 the skill is an
  accelerator.

## When To Run

- Before approving a PR / phase for merge (2.7).
- During ACCEPTANCE prep when auditing recently merged work — the rubric works
  retroactively.

Skip when the change is a typo fix, docs-only patch with no semantic shift, or a
generated-file refresh (lockfile, build artifact). Document the skip in the merge
note.

## The Six Dimensions

| Dimension | Weight | Scoring criteria |
|---|---|---|
| Correctness | 3 | 0 = breaks intended behavior; 1 = happy path only; 2 = handles documented edge cases; 3 = handles every SC-NNN the REQ names + ≥1 unstated. |
| Security | 2 | 0 = introduces a vuln or exposes a secret; 1 = no new risk but does not harden; 2 = explicitly defends a previously-soft surface (input validation, authz check, audit trail). |
| Quality | 2 | 0 = unreadable / duplicates existing patterns; 1 = readable, follows patterns; 2 = simplifies or removes complexity beyond the immediate change. |
| Performance | 1 | 0 = visibly slower under documented load; 1 = no regression or measurable improvement. |
| Maintainability | 1 | 0 = adds dead code, unused abstractions, or tight coupling; 1 = leaves the surface easier to change next time. |
| Tests | 1 | 0 = no proof or weakens existing proof; 1 = adds proof at the right level (unit / integration / E2E) for the new behavior. |

Max total **10**. Pass threshold **≥7**. Fractional scores allowed (e.g.
correctness 2.5) when one criterion is partial.

## Pass / Fail Gate

- **≥7:** pass. Merge approved.
- **<7:** block merge. Reviewer writes one-line remediation per failing dimension;
  author re-submits.

Floor rule: **any dimension scoring 0 is an automatic block** regardless of total.
A 0 is a regression, not a low score.

Floor rule (design-system): a **UI screen with no floorplan classification OR
that violates its assigned §4 floorplan / §7 action-placement / §8 modal / §10
feedback rules = automatic merge block** — same auto-block mechanic as a
dimension scoring 0, independent of the total. The source-of-truth checklist is
`docs/gates/design-system-compliance.md` (filled per screen); the screen's
floorplan row lives in `docs/visuals/diagrams/screen-inventory.md`. This does not
add a scored dimension — the six weights and the ≥7 threshold are unchanged; it
is a floor that blocks regardless of score.

Floor rule (visual fidelity): an **APP/ADM screen that is structurally/visually
divergent from its prototype export render — or that has neither an export
source citation nor a recorded `rebuild (decision: <slug>)` marker in its
build-manifest phase block — = automatic merge block**, same auto-block mechanic,
scores unchanged. Source-of-truth checklist: `docs/gates/visual-fidelity.md`;
port-first rule: `build-execution.md` § Prototype → Code Fidelity. (Evidence for
why: a design-heavy build passed every scored dimension while looking nothing
like the frozen mockup and was rejected at UAT — auto-script Macro-2.)

Floor rule (no generic error-swallow): a **user-facing operation that can fail
but surfaces only a generic message ("something went wrong") instead of the real
cause = automatic merge block**, same mechanic. The real cause (tier/quota
limit, provider error, validation detail) must reach the UI — sanitized of
internals, but specific. (Evidence: real tier-gate errors were swallowed into a
generic toast; the failure was only diagnosable in manual UAT — auto-script
Macro-2.)

**Systemic-pattern sweep rule (Correctness dimension):** when the diff fixes an
instance of a systemic pattern (error handling, model/tier resolution, auth,
quota, permission checks), the reviewer MUST grep all call-sites of that pattern
and confirm every sibling is covered. **A fix that leaves sibling sites broken
is an automatic review finding** (Correctness capped at 1 — happy path only —
until the sweep is done or the siblings are shown out of scope). Prefer a single
chokepoint (one resolver/guard/helper) over per-feature patches — score Quality
accordingly. (Evidence: a tier-model fix patched one generator; every sibling
AI-gen entrypoint kept the broken default and failed in UAT — auto-script
Macro-2, systemic tier-model fix leg.)

Red-team coupling: the Security dimension **auto-blocks** if a money-handling or
auth surface lacks signature/authz verification (see `payment-integration.md`).
Red-team is required at the high-risk Build gates (2.2 threat-model, 2.9 security,
2.10 DoD) per `docs/WORKFLOW.md`.

## Per-Tier Application

| Lane | Application |
|---|---|
| Tiny | Optional. Reviewer may approve by inspection. |
| Normal | Required. One reviewer applies the rubric; result attached to the PR. |
| High-risk | Required. Two reviewers apply the rubric independently; merge requires both ≥7. |

## Output Report Template

```markdown
# Review — <PR id or commit short sha>

Phase / story: `<module>-NN-slug.md` (or "no story — tiny lane")
REQ-IDs touched: `IF.AUTH.01`, `IF.RBAC.02`, ...
SC-NNN proven: `SC-001`, ...

| Dimension | Weight | Score | Notes |
|---|---|---|---|
| Correctness | 3 | 3 | All SC-* verified, including SC-004 not in the phase plan. |
| Security | 2 | 1 | No new risk; did not harden the auth path it touches. |
| Quality | 2 | 2 | Removed duplicate validator; net -30 LoC. |
| Performance | 1 | 1 | Bench-checked: same throughput. |
| Maintainability | 1 | 1 | Extracted helper; one fewer hardcoded path. |
| Tests | 1 | 1 | Added TC-005 covering SC-004. |
| **Total** | **10** | **9** | |

**Verdict:** PASS (9 ≥ 7).
**Remediation (if any):** none.
```

The REQ-IDs use `MODULE.AREA.NN`; scenarios use `SC-NNN`; tests use `TC-NNN` (D3).
The composite `US-NNN.REQ-MMM` form is **not used**.

## Weight Decision

Weights `3 / 2 / 2 / 1 / 1 / 1` (correctness / security / quality / performance /
maintainability / tests) privilege correctness + security over polish, matching
the harness "ship small, validate" priority. Recalibrate only when accumulated
review data surfaces a pattern → record in a `docs/decisions/<slug>.md`.

## Variant Section

(Append a Variant block here when this rubric fails or partially works. Do not
delete the original dimensions or weights.)

## Related

- `docs/WORKFLOW.md` § 2.7 — the step this playbook owns; § 2.9/2.10 — red-team
  gates.
- `docs/TRACE_SPEC.md` — REQ-ID / SC-NNN / TC-NNN tokens cited in review reports.
- `scenario-taxonomy-playbook.md` — the SC-NNN the Correctness dimension validates.
- `canonical-e2e-flow-playbook.md` — the TC-NNN the Tests dimension checks.
- `payment-integration.md` — the Security auto-block source for money surfaces.
- `docs/gates/design-system-compliance.md` — the per-screen checklist the
  design-system floor rule reads (source of truth for §4 / §7 / §8 / §10).
- `docs/gates/visual-fidelity.md` — the per-screen checklist the visual-fidelity
  floor rule reads (app screenshot vs prototype export).
- `build-execution.md` § Prototype → Code Fidelity — the port-first default the
  fidelity floor rule enforces; § Implementation Guardrails — the systemic-sweep
  + error-surfacing rules the author applies before review.
- `docs/design-system/design-rules.md` — Tier-1 floorplan + behavior doctrine the
  floor rule enforces (§4 floorplans, §7 actions, §8 modals, §10 states).
- `design-system-3-tier.md` — the cross-stage playbook that owns 3-tier enforcement.
- `docs/ROLE_MAP.md` — Tech Lead (reviewer hat) + `ck-code-review` engine binding.
