# Harness Changelog

Version log of the harness operating model itself (docs, playbooks, gates,
templates). Per-project state never lives here. Current version: **v4**.

## v4 — 2026-07-08 — BS6: per-phase acceptance-verification gate

The 6th blind spot from the auto-script Macro-2 field run — and its biggest
token sink: the loop built ALL phases first and verified heavily only at the
end (2.7 review / 2.8 e2e / 2.9 security / 2.10 QA / 2.12 UAT), so per-phase
deviations accumulated silently and surfaced together at UAT, forcing rework
across already-done phases. **Trade-off / token rationale:** each phase now
pays a small verification cost (one independent verifier run + an occasional
operator look), buying out the end-of-run failure mode — a defect caught in
its own phase costs one in-context fix cycle; the same defect found at the end
costs re-discovery, cross-phase rework, and re-verification of everything
built on top. Field evidence (auto-script): several end-discovered defect
classes (unported UI, swallowed errors, sibling call-sites) each triggered a
full UAT-fix round; per-phase catch would have contained each inside its phase.

- **New gate `docs/gates/phase-acceptance.md`** — a 2.6 phase is done only when
  its Acceptance Criteria are verified on the RUNNING app: **(a) agent
  verifier, every phase, non-waivable** — an independent subagent (never the
  implementer) re-runs the phase's AC (functional + visual-fidelity per shipped
  screen + negative-path) against the preview and returns PASS/FAIL; FAIL is
  fixed inside the same phase (cap 3 rounds → BLOCKED); **(b) human checkpoint
  by cadence knob** (`per-phase` | `per-ui-phase` default | `per-milestone` |
  `end-only`) — pages the operator (internal — never the client) with the
  preview URL; the next phase waits for the OK. Auto-block: `/build-phase`
  refuses the next phase while the previous one's acceptance is incomplete.
- **Build-manifest template:** header knobs (**Human checkpoint cadence**,
  **Preview command**); Progress table gains **Verify-by** (`agent` | `both`)
  + **Accepted** columns; acceptance checks upgraded to three MANDATORY
  categories (functional + negative-path + visual-fidelity); coverage
  checklist enforces it. Compilation playbook derives `Verify-by` from the
  cadence at 2.3.
- **Incremental preview** (`build-execution.md` § Incremental Preview): the
  P0 compose/dev stack stays bootable at every phase close (staging deploy
  optional) — both verification legs and the operator inspect each module on
  the real app as it lands, not for the first time at UAT. An un-bootable app
  at a phase boundary FAILs acceptance regardless of the diff.
- **Wiring:** WORKFLOW 2.6 row + Gate rebalance note + Canonical Gate List row
  (**Phase Acceptance**); STAGE_GOALS 2.6 goal; `/build-phase` steps 2/5/6 +
  rules; stage-runner 2.6 (never self-certifies acceptance; leaves the preview
  running); DoR line (AC categories + Verify-by + cadence/preview declared);
  DoD line (acceptance record complete — not retroactively fillable); gates
  README. The end-of-manifest 2.7/2.8/2.10 passes are re-framed as
  **aggregation and cross-phase confirmation**, no longer the first catch.

## v3 — 2026-07-07 — UAT blind-spot hardening

Bakes 5 blind spots from the first full Macro-2 field run (auto-script) into
gates — each surfaced as a manual UAT-fix round that a gate should have caught:

- **BS1 — Visual fidelity (biggest):** flipped the APP/ADM default from
  "rebuild via design-system" to **port the prototype export** as the primary
  implementation reference (`playbooks/build-execution.md` § Prototype → Code
  Fidelity; deviation needs a recorded decision). New per-screen gate
  `docs/gates/visual-fidelity.md` (running-app screenshot vs export render;
  divergent = block) wired as a 2.6 self-check, 2.7 floor rule, 2.10 evidence
  pass, and a DoD line; added to the WORKFLOW Canonical Gate List.
- **BS2 — Error swallowing / happy-path-only e2e:** `canonical-e2e-flow-playbook.md`
  § Mandatory Coverage Rules — negative-path e2e required for every failable
  user-facing op (AI-gen, tier/quota, payment), asserting the REAL cause
  surfaces; "no generic error-swallow" added as a 2.7 floor rule.
- **BS3 — Fix-one-miss-the-rest:** systemic-pattern sweep rule in
  `code-review-scoring.md` + `build-execution.md` guardrails — a systemic fix
  must grep all call-sites and cover every sibling (prefer a single chokepoint);
  siblings left broken = automatic review finding.
- **BS4 — Auth not tested to data-load:** every auth method needs an e2e proving
  login → real authenticated data loads (200), plus a switch-auth-on-same-browser
  cookie-hygiene case; single cookie-scope authority note (one writer, one
  scope) in `canonical-e2e-flow-playbook.md`.
- **BS5 — Stale PUB product-shots:** PUB product-shot capture is a LATE phase
  depending on the APP screen phases it depicts (`build-execution.md`,
  build-manifest template + compilation playbook, DoR line).
- **Meta:** build-manifest template — every screen line cites its prototype
  export source + fidelity strategy (`port from export` | `rebuild (decision:
  <slug>)`) and carries a fidelity acceptance check.

## v2 — 2026-07-06 — proof-run hardening

Control-plane + stack-template fixes (F1..F18) from the walking-skeleton proof
run benchmarked against hasi-hub (9/9 criteria); stack template at
`templates/stack-pnpm-nest-next/` (see its `TEMPLATE_VERSION`).

## v1 — 2026-07-05 — initial import

Harness skeleton imported from the auto-script embedded copy and genericized
for reuse: 3-macro WORKFLOW + STAGE_GOALS, gates, playbooks, templates,
build-manifest layer, `/build-phase` loop, installer.
