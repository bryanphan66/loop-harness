# Scenario Taxonomy Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Twelve-dimension shape for turning a requirement (REQ-ID) into an explicit list
> of edge cases to prove. Mints **SC-NNN**. Output feeds the RTM forward column +
> the verification register (TC-NNN at 2.8). Owns Pre-Build **step 1.8**.

**Macro-stage / step:** Pre-Build · 1.8 (after 1.7 BA bundle, before 1.9 feature
register). Re-used in Build at 2.8 to anchor E2E tests. **High-risk REQ-IDs only**
in Pre-Build; record an explicit skip for the rest.

## Engine

- **Fast path:** `ck-scenario` (decomposes a feature across 12 dimensions).
- **Role:** BA. **Bare-agent fallback:** the `researcher` agent walks the 12
  dimensions below by hand and emits the same SC table. Per D1 the skill is an
  accelerator. In Build, `ck-e2e-flow` owns the Build-side scenario expansion
  — this playbook owns the Pre-Build risk discovery (no duplication between the two).

## When To Run

- **Pre-Build (1.8):** per high-risk REQ-ID, after the RTM is backward-complete
  (1.7) and before the feature register freezes (1.9). Scenarios surface risk that
  may move a feature's price or push it to a later phase.
- **Build (2.8):** re-run for any REQ-ID whose scenarios were skipped in Pre-Build,
  as input to E2E test design (`canonical-e2e-flow-playbook.md`).

Skip a dimension when it plainly does not apply — but **declare the skip** in the
scenario-doc header so reviewers see intentional omission.

## The Twelve Dimensions

| Dimension | Definition | Sample questions |
|---|---|---|
| Input validation | Malformed, empty, oversized, wrong-type input | What happens on a 10MB upload? On Unicode in an ASCII field? On a negative count? |
| Concurrency | Two actors hit the same surface at once | What if two managers update the same role simultaneously? What is the lock granularity? |
| State | Entity is in an unexpected state when the action runs | What if the user is suspended? What if the resource was deleted between fetch and update? |
| Boundary | Values at zero, max, or just past either | What if the page is page 0? What if 100,001 items exist when the cap is 100k? |
| Error | A dependency fails | What if the email service is down? What is the recovery path? What does the user see? |
| Performance | Load is 100x expected | What is the slow case? What backpressure exists? What times out first? |
| Security | The actor is malicious | What if a non-admin guesses the admin URL? What if input is SQL/XSS payload? |
| Compliance | External rules govern the surface | Does GDPR / SOC2 / domain regulation apply? Where is consent captured? |
| Integration | A downstream API changes shape | What schema validation runs on the boundary? What is the contract test? |
| Data | Data is dirty (nulls, duplicates, drift) | What with an orphan FK? With a stale soft-delete? With a NULL where NOT NULL was expected? |
| Deployment | Something breaks at deploy time | What is the migration order? What about blue/green compatibility? |
| Rollback | We have to revert | Is the migration reversible? Is the feature gated by a flag that can flip back? |

## Output Shape

Per high-risk REQ-ID (or grouped per module when granularity demands), produce a
scenarios doc under `docs/requirements/scenarios/<module>.md`:

```markdown
# Scenarios — IF.RBAC (manager updates member role)

Skipped dimensions: compliance (no regulatory surface for this module).

| SC ID | Dimension | Scenario summary | Expected outcome | REQ-traceback |
|---|---|---|---|---|
| SC-001 | Input validation | Empty role string | Reject 400; no DB write | IF.RBAC.01 |
| SC-002 | Concurrency | Two managers update same member's role within 100ms | Last write wins; both see toast acknowledging current state | IF.RBAC.03 |
| SC-003 | Security | Non-manager calls API directly | Reject 403; audit log entry | IF.RBAC.02 |
| SC-004 | Rollback | Feature flag flips off mid-update | In-flight requests complete; new requests see old surface | IF.RBAC.01 |
```

SC IDs use a **global zero-padded counter** within the project (`SC-001`,
`SC-002`, …) per `docs/process/TRACE_SPEC.md`. The `REQ-traceback` column cites the
`MODULE.AREA.NN` REQ-ID the scenario decomposes. The composite `US-NNN.SC-MMM`
form is **not used** (D3).

## Per-Tier Application

| Lane | Application |
|---|---|
| Tiny | Optional. Inline narrative coverage is sufficient. |
| Normal | Required for high-risk REQ-IDs. Cover dimensions that plausibly apply; declare skips. |
| High-risk | Required. Cover all 12 dimensions explicitly — skip-declarations included. |

## Hand-Off

- **To RTM (1.7/2.12):** each SC-NNN lands in RTM Section 2 forward column against
  its REQ-ID. A high-risk REQ-ID with no SC-NNN and no recorded skip is an
  **incomplete RTM** (per `docs/process/TRACE_SPEC.md`).
- **To feature register (1.9):** scenarios that reveal material risk (e.g. a
  concurrency or migration hazard) feed the register's risk/assumption notes and
  may reprice or re-phase the feature.
- **To Build (2.8):** each SC-NNN becomes a verification-register row; the test
  suite assigns a **TC-NNN** that closes the loop: `IF.RBAC.01 → SC-001 → TC-001`.

## Variant Section

(Append a Variant block here if this taxonomy fails to capture an edge case that
recurs across projects. Do not delete the original 12 dimensions.)

## Related

- `docs/process/TRACE_SPEC.md` § Token Types — SC-NNN format + chain position.
- `docs/process/WORKFLOW.md` § 1.8 — the step this playbook owns.
- `discovery-interview-playbook.md` / `ba-core-doc-bundle.md` — produce the
  high-risk REQ-IDs this playbook decomposes.
- `canonical-e2e-flow-playbook.md` — Build-side consumer (TC-NNN closes the SC).
- `code-review-scoring.md` — the Correctness dimension validates SC coverage.
- `docs/process/ROLE_MAP.md` — BA role + `ck-scenario` engine binding.
