# Harness Changelog

Version log of the harness operating model itself (docs, playbooks, gates,
templates). Per-project state never lives here. Current version: **v3**.

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
