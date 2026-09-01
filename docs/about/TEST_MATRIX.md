# Test Matrix

Maps product **behavior → proof**, and carries the **Verification Register** that
the verify-gate parses on every commit. Empty but well-formed — rows are added in
Build & Go-live (step 2.8), born from the BA acceptance criteria, never from code.

**Token grammar (D3, the only scheme — `docs/process/TRACE_SPEC.md`):**
`TC-NNN ← SC-NNN ← REQ-ID (MODULE.AREA.NN)`. A test (`TC-NNN`) proves a scenario
(`SC-NNN`), which decomposes a requirement (`REQ-ID`). **Do not use
`US-NNN.REQ-MMM`.**

No product behavior is defined yet. Do not mark a row implemented until tests or
validation evidence exist.

## Status Values

| Status | Meaning |
|---|---|
| `planned` | Accepted as intended behavior, not implemented |
| `in_progress` | Actively being built |
| `implemented` | Implemented and proof exists |
| `changed` | Contract changed after earlier implementation |
| `retired` | No longer part of the product contract |

## Behavior → Proof Matrix

The **Contract** column must cite ≥1 `REQ-ID`, and (for high-risk behavior) the
`SC-NNN` it covers, plus the `TC-NNN` that proves it — the trace chain in one row.

| Behavior | Contract (REQ-ID ← SC-NNN → TC-NNN) | Unit | Integration | E2E | Platform | Status | Evidence |
|---|---|---|---|---|---|---|---|
| _TBD_ | Add rows at step 2.8. Example: `IF.AUTH.01 ← SC-007 → TC-012 — user logs in with valid credentials` | no | no | no | no | planned | none |

### Evidence Rules

- **Unit** — pure domain and application rules.
- **Integration** — backend enforcement, data integrity, provider behavior, jobs, service contracts.
- **E2E** — user-visible browser flows.
- **Platform** — only shell / deployment / mobile / desktop / runtime behavior that cannot be proven in a lower layer.
- A behavior may be implemented without every proof column if the story packet explains why.

## Verification Register

The **mechanical half of "done"**. The matrix above says *which kinds* of proof
exist; this register says *the exact command that re-checks the contract* and
*the result of the last run*. The verify-gate (`scripts/harness-verify-gate.sh`,
run by `.githooks/`) parses the **Result** column and blocks a stage-close commit
on any `fail` (and on any `never-run` at a stage-close).

**Column spec:**

| Column | Meaning |
|---|---|
| **Behavior / TC-NNN** | The behavior under test + its `TC-NNN` id (which proves an `SC-NNN`, which decomposes a `REQ-ID`). |
| **Verify command** | The single command that re-proves it (`npm test -- auth`, `pnpm e2e auth.spec`, or a `MANUAL:` step). |
| **Last verified** | `YYYY-MM-DD` of the last run, or `never`. |
| **Result** | `pass` / `fail` / `never-run` — **the field the verify-gate reads**. |

| Behavior / TC-NNN | Verify command | Last verified | Result |
|---|---|---|---|
| _TBD_ | The single command that re-proves this behavior (or a `MANUAL:` step the human signed off). | never | never-run |

### Rules

- A behavior is not closeable until its Verify command ran and `Result` is `pass`,
  **or** the story packet explains why no command exists (pure-docs, design-only,
  or a `MANUAL:` checkpoint the human signed off).
- **Planned work stays OUT of the register until it runs.** Track intended
  behavior as `planned` in the Behavior → Proof Matrix above; add its register
  row (with the real command + result) only when the verify command first runs.
  The verify-gate blocks ANY `never-run` register row on a stage-close commit —
  including Pre-Build doc-only closes — so a planned row parked here would
  freeze every stage close until it runs.
- `Last verified` + `Result` update in the **same commit** that closes the
  behavior or its stage — drift between this register and the proof matrix is a bug.
- For a `MANUAL:` verify step, the result is the human's sign-off reference (UAT
  row, `docs/uat/*`, or a dated checkpoint).
- **No bypass:** agents must not `git commit --no-verify` or unset `core.hooksPath`
  to get past a red gate (`AGENTS.md` § Verify Gate — No Bypass). A red gate means
  real work remains.

See the enforcement detail in `AGENTS.md` § Verify Gate and the RTM completeness
rule in `docs/process/TRACE_SPEC.md`.
