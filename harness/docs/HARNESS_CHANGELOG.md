# Harness Changelog

Version log of the harness operating model itself (docs, playbooks, gates,
templates). Per-project state never lives here. Current version: **v5**.

## v5 — 2026-07-10 — BS7: non-CRUD delivery capability

The 7th blind spot from Macro-2 field runs: the harness assumed **every phase =
CRUD** (entities + endpoints + screens). A REQ-ID whose real work is **async job /
media pipeline / object storage / external integration** had no slot — the 2.3
compile silently folded it into a CRUD phase, the build agent improvised the risky
infra per-phase unproven, and phase-acceptance had no way to assert the right NFRs
(idempotency, signed-URL entitlement, multi-bitrate ladder, webhook signature).
This is the exact class that stalls Macro-2. **Field evidence (elearning-platform
prototype):** the frozen client prototype mandates a full video pipeline
(`C2 video-player-learning-screen` — HLS 1080p · CDN R2; `D1.4
LessonUploadProcessing` — 248MB → HLS 480/720/1080, 72%; max 2GB) plus async
cert/invoice PDF+QR and SES/Zalo email (SRS `SC-016..022`, `nfr.md PERF.04–06`,
`IF.DB.02` queue, `PLF.STORAGE.01` R2, `CT.ISSUE.01` async PDF) — none expressible
in a CRUD-only manifest. **Trade-off / token rationale:** four new playbooks + a
manifest `Phase-type` add authoring surface, but they buy out the Macro-2 stall —
the build agent now **wires** proven tier-2 primitives (contract fixed once) instead
of re-architecting queue/storage/transcode per project and shipping unverified
infra that only fails at UAT. A media/async defect caught at its own phase costs one
in-context fix; the same defect surfacing at 2.10/2.12 costs cross-phase rework (the
v4 lesson, now extended to non-CRUD). CRUD-only projects pay **nothing** — tier-2 is
opt-in (YAGNI); the walking skeleton stays `db+api+web`.

- **Manifest `Phase-type`** (`docs/templates/build-manifest.md`): enum `crud`
  (default) `| async-job | media-pipeline | external-integration | storage`. For
  non-CRUD types Entities/API/Screens are optional; the block adds type-specific
  fields + **type-specific acceptance categories** that extend the CRUD trio
  (functional + negative + visual-fidelity). New § Non-CRUD phase-types table +
  coverage-checklist row.
- **Compile routing** (`build-manifest-compilation.md` step 4b + anti-pattern): a
  REQ-ID citing an async/media/storage/integration signal (transcode, HLS, upload,
  queue, webhook, signed-url, storage, PDF-render, email-blast) MUST get a non-CRUD
  phase-type — CRUD-folding it is a 2.3 compile defect.
- **Four new playbooks** (mirroring `payment-integration.md` rigor, composed per
  `playbook-composition-pattern.md`): `async-job-queue.md` (BullMQ+Redis —
  idempotency-key · retry/backoff+dead-letter · status API · real-cause failure) ·
  `object-storage.md` (S3/R2 adapter — signed PUT/GET · entitlement · cleanup ·
  quota · minio parity) · `media-pipeline.md` (composes the two + ffmpeg —
  resumable upload · transcode atomicity + 480/720/1080 ladder · signed HLS manifest
  · progress · cleanup + documented ffmpeg command) · `external-integration.md`
  (SES/Zalo/webhook — sandbox/prod credentials · webhook signature verify ·
  idempotent handling · retry + provider-error · adapter abstraction).
  payment-integration stays the concrete money instance.
- **Tier-2 primitives (shipped by the stack template — separate build):** queue
  `apps/api/src/common/queue/` (`enqueue(name,payload,{idempotencyKey}) -> jobId;
  status(jobId)`), storage adapter `apps/api/src/common/storage/`
  (`StorageAdapter { put; signedGetUrl; signedPutUrl; delete }`, drivers s3/r2 +
  local/minio), worker `apps/worker/`; Redis/minio opt-in compose profiles.
  Playbooks reference these exact contracts so projects **wire, not architect**.
- **Acceptance/NFR wiring** (`phase-acceptance.md`): the 2.6 verifier exercises the
  type-specific categories against the running preview — the **streaming NFR**
  (first-byte, signed-URL entitlement, multi-bitrate present) asserted at the media
  phase, not only 2.11. Verdict block gains a `Type-specific:` line. DoR (phase-types
  routed + tier-2 surfaced) + DoD (non-CRUD categories recorded at-phase) lines.
- **Wiring:** WORKFLOW non-CRUD-phase-types note + Quick Links; STAGE_GOALS 2.2
  (stack pick surfaces tier-2 when async/media/storage/integration in scope) + 2.3
  (compile routes phase-types); playbooks README index rows; HARNESS growth note.
  **Independence Principle intact** — no new hard `ck-*` dep (playbook engines are
  existing `backend-development` / `media-processing` / `devops` accelerators with
  bare-agent fallbacks).

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
