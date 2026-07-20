# What's new vs the default harness

This document is the **review map** for `videcode-harness`: exactly what was
**added** and **changed** relative to the original embedded harness, so a
reviewer can see the delta without diffing two trees by hand.

- **Baseline (“default ban đầu”)** = the harness embedded in the first pilot
  project `auto-script` (the original vibecode-harness). Everything below is the
  delta of **`harness/`** in this repo against that baseline.
- **How this list was produced**: a real file-by-file `diff -rq` of
  `videcode-harness/harness/{docs,.claude,scripts,AGENTS.md}` against
  `auto-script/{docs,.claude,scripts,AGENTS.md}` — not hand-authored.
- **Authoritative, version-by-version record**: `harness/docs/HARNESS_CHANGELOG.md`
  (811 lines, up to **v6.20**). This file is the summary; the changelog is the detail.

## TL;DR — where the work went

The baseline ran **Macro 1 (Pre-Build)** well but **Macro 2 (Build & Go-live)
never produced a running app** — it stalled at spec + prototype. This repo puts
the **teeth and the engine** into Macro 2:

- **Machine gates with real teeth** — the two biggest new files are the
  `phase-acceptance` gate (Legs 1–27, 474 lines) and the `visual-fidelity` gate
  (U1–U19, 489 lines). They are **retrospective-enriched**: v6.19/v6.20 mined
  330+ real defects from two shipped projects and folded each recurring,
  machine-checkable class into a gate.
- **A spec→code conversion engine** — build-manifest + walking skeleton +
  `/build-phase` loop, so a frozen spec becomes verified, deployed code one
  gated phase at a time.
- **Go-live discipline** — `config-driven-identity` + `go-live-deploy-verify`
  (verify-at-source, fail-closed) + `pre-demo-self-qa-checklist`.

**Counts:** 16 new doc files, 24 changed doc files, +2 new `.claude` files,
5 changed `.claude`/`scripts` files, `AGENTS.md` rewritten.

---

## NEW files (did not exist in the baseline)

### Gates — `harness/docs/gates/`
| File | What it is |
|---|---|
| `phase-acceptance.md` | **The core new gate.** Legs 1–27 run every build phase against the running app: functional AC · visual fidelity · negative path · type-specific checks · universal-UI floor · security/IDOR/rate-limit/session · grid completeness · route-reachability · seed-coherence · build+migration hygiene · create/edit-DTO round-trip · record-lifecycle · i18n-catalog · concurrency/atomicity · resilience · multi-instance · prod-image packaging. |
| `visual-fidelity.md` | Auto-blocks **U1–U19**: adopt the prototype export as code (not re-draw), whole-screen completeness, dead-affordance, responsive reflow, enum-status exhaustiveness, copy byte-fidelity, shared-primitive integrity, toast convention… |

### Playbooks — `harness/docs/playbooks/` (11 new)
| File | Why it was added |
|---|---|
| `build-manifest-compilation.md` | The spec→code conversion layer (ordered phases P0..PN, one REQ-ID per phase). |
| `prototype-export-adoption.md` | Bring the frozen prototype export in as code instead of re-drawing it. |
| `pre-demo-self-qa-checklist.md` | A runnable 7-group self-QA the agent drives before any human handoff. |
| `config-driven-identity.md` | Brand/company identity flows from config into cert/invoice/email/json-ld. |
| `go-live-deploy-verify.md` | Verify-at-source, fail-closed deploy (running artifact carries the release — not CI-green / HTTP 200). |
| `demo-video-production.md` | Real-screenshot device-framed media + product-tour demo video recipe. |
| `seed-data-pattern.md` *(also see changed)* | — |
| `async-job-queue.md` | Phase-type playbook: background jobs / queues. |
| `media-pipeline.md` | Phase-type playbook: transcode / HLS / media. |
| `object-storage.md` | Phase-type playbook: R2 / uploads / signed URLs. |
| `external-integration.md` | Phase-type playbook: third-party API integration. |
| `status-surfaces-ops-and-client.md` | Ops board + client status artifacts. |

### Templates — `harness/docs/templates/`
| File | What it is |
|---|---|
| `build-manifest.md` | The build-manifest template the compilation playbook fills. |
| `srs-lite.md` | A lighter SRS to avoid Macro-1 document bloat. |

### Engine — `harness/.claude/`
| File | What it is |
|---|---|
| `commands/build-phase.md` | **The `/build-phase` command** — builds ONE manifest phase, then an independent verifier runs the phase-acceptance gate against the running preview. This is the missing Macro-2 engine. |
| `settings.json` | Harness settings (hooks/permissions) shipped with the skeleton. |

### Meta
| File | What it is |
|---|---|
| `harness/docs/HARNESS_CHANGELOG.md` | Full version history v6.0 → v6.20 with the rationale for every gate. |
| `MACRO-2-GUIDE.md` *(repo root)* | The Macro-2 usage guide (flow 2.1→2.13, gates, how to run). |

---

## CHANGED files (existed in baseline, modified here)

### Gates & core docs
`docs/HARNESS.md` (operating model) · `docs/WORKFLOW.md` (step tables + gate list,
now 362 lines) · `docs/STAGE_GOALS.md` · `docs/ROLE_MAP.md` · `docs/CONTEXT_RULES.md`
· `docs/TEST_MATRIX.md` · `docs/gates/dor-build.md` · `docs/gates/dod-build.md` ·
`docs/gates/pb-g4-contract-deposit.md` · `docs/gates/README.md`.

### Playbooks (rewritten/expanded)
`build-execution` · `code-review-scoring` · `canonical-e2e-flow-playbook` ·
`e2e-qa-field-by-field-verify-with-report` · `payment-integration` ·
`scenario-taxonomy-playbook` · `seed-data-pattern` · `session-retrospective` ·
`solo-dev-client-delivery` · `bilingual-delivery-template-pattern` ·
`playbooks/README.md`.

### Engine & scripts
`.claude/agents/stage-runner.md` · `.claude/commands/gate-check.md` ·
`.claude/commands/stage-next.md` · `scripts/harness-verify-gate.sh` ·
`scripts/install-harness.sh` · `scripts/README.md` · `AGENTS.md` (control-plane
operating model, rewritten).

---

## How to review (suggested order)

1. **`harness/docs/HARNESS_CHANGELOG.md`** — read top-down; every version says *what*
   gate/playbook was added and *why* (which real defect it prevents).
2. **`MACRO-2-GUIDE.md`** — the end-to-end Build & Go-live flow (2.1 → 2.13).
3. **`harness/docs/gates/phase-acceptance.md`** + **`visual-fidelity.md`** — the two
   gates that carry most of the new value; skim the Legs / U-numbers.
4. **`harness/.claude/commands/build-phase.md`** — the engine that turns a phase into
   verified code.

## Open questions for the reviewer

- Is the gate set (Legs 1–27 / U1–U19) the right floor for *your* project type, or
  do we need a project-specific profile?
- `srs-lite` vs the original heavy SRS — is the lighter Macro-1 acceptable for your
  scope, or do you need the full RTM?
