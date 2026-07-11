# Harness Changelog

Version log of the harness operating model itself (docs, playbooks, gates,
templates). Per-project state never lives here. Current version: **v6.3**.

## v6.3 — 2026-07-11 — the stale-export trap: pin + re-verify the export against the LIVE prototype

The most serious fidelity failure of the elearning run, and the deepest reason
the "99% adopt-the-export" claim was hollow: **the local export copy in the repo
had drifted from the live frozen Claude-Design prototype.** The repo carried a
**v2.2** portal chrome (header + sidebar both deep-green-ink `#07130c`,
near-black); the LIVE prototype had advanced to **v3.5/v4.1** — a WHITE
`--surface` topbar + a brand-green forest-gradient sidebar with a ribbon-pattern
SVG. approach-B adopted the stale local copy faithfully, so the app shipped a
near-black chrome the client never approved, and every "matches the export" check
passed because it compared the app to the same stale cache. Confirmed by pulling
the live `components.css` via DesignSync and diffing: the live chrome rule is
`.shell-topbar { background: hsl(var(--surface)) }` (white) + a multi-layer green
`.shell-sidebar` with `url("sidebar-pattern.svg")`, versus the repo's `#07130c`.

Root lesson: **the export under `docs/visuals/prototype/` is a CACHE, not the
source of truth — the live Claude-Design project is.** A cache goes stale as the
designer keeps editing. Fix — `prototype-export-adoption.md` § Source Freshness:
pin the live project id + version, **re-pull and diff local-vs-live before
adopting and again at re-verify**, refresh the cache when they disagree, and
measure fidelity against live-derived screenshots so a stale cache cannot
self-certify. Gate Auto-Block rule 10 enforces it. (elearning was re-synced to
the live v3.5/v4.1 chrome as the corrective.)

## v6.2 — 2026-07-11 — theme fidelity in BOTH modes (U3) + shell-stays-put (U4); the scaffold-token-override trap

Human review of the app-shell in DARK mode exposed why "adopt the export → 99%"
still shipped **badly wrong colours**: the light theme (the frozen default) was
faithful, but three net-new app-shell behaviours were never verified. The deep
root cause of the colour break: the scaffold's `apps/web/src/app/globals.css`
**re-declared the export's entire token set inside `@layer base` with divergent
values** — and Tailwind v3 `@layer base` is not a native cascade layer, so it
emits plain CSS *after* the imported `tokens.css` and **silently overrode the
adopted export in BOTH modes** (dark `--background` was `150 39% 10%` instead of
the export's `150 32% 6%`; the sidebar fell to a near-black body colour instead
of the export's deep-green ink). Adopting the export CSS is necessary but **not
sufficient if a scaffold stylesheet redeclares the same token names.**

Two more universal Tooth-A assertions (always-on, not per-screen): **U3 theme
fidelity** — the computed token in **both** light and dark must equal the export
value (not a scaffold value), and the portal chrome keeps its own brand
background in dark; **U4 shell-stays-put** — scrolling the content must not move
the sidebar/topbar (the shell is viewport-bound, only the inner region scrolls).
Auto-Block rules 8 + 9. Tooth B (human glance) is now **captured in both light
AND dark when the export ships a dark theme** — the wrong-dark defect was
invisible because only light was ever glanced. Companion misses fixed the same
round: the user-chip dropped its name+role on port, and the shell used
`min-height:100vh` (content grew the grid → document scrolled) instead of
`height:100dvh`.

## v6.1 — 2026-07-11 — two universal fidelity assertions + app-shell-first sequencing

Same elearning run, one phase later: the v6 toothy gate still let two
cross-cutting defects through because they are not per-screen element checks.
(1) `/admin/roles` shipped as a **bare panel** — a one-item sidebar + empty
topbar — missing ~90% of the frozen portal chrome (full role-gated nav, search,
VI/EN, dark-mode, notification bell, user menu); its own content assertions were
green. (2) The create-role modal's text input **lost focus after every
keystroke** (a `Dialog` focus effect depending on an inline `onClose` re-ran per
render) — the same interaction class as the earlier OTP-backspace miss, but on a
different screen with no assertion covering it.

Fix — `docs/gates/visual-fidelity.md` § Tooth A gains **two UNIVERSAL, always-on
assertions** (not per-screen opt-in): **U1 app-shell-present** — every APP/ADM
screen must render inside the portal chrome (sidebar sections + topbar controls),
so a screen built as an isolated panel is RED; **U2 input-focus** — typing a
multi-char string in one burst must land intact with the field still focused, so
any remount / per-keystroke focus effect is RED. Auto-Block rules 6 + 7 encode
them. `prototype-export-adoption.md` § Kit-First Ordering now states the
**app-shell is part of the P0.5 foundation** (ported + mounted before any inner
screen; inner screens are its children), closing the sequencing gap that let a
screen ship without its shell.

## v6 — 2026-07-11 — toothy fidelity gate + adopt-export-as-code (FC2/FC3 root fix) + FC6/FC7

The live elearning-platform run surfaced a CLASS of UI-fidelity failure the v3
"port-first" rule did not close: **P1/P2/P3 diverged hard from the frozen
Claude-Design prototype** (dark theme instead of the export's light, logo +
"Đăng ký học" link + VI/EN toggle dropped, washed-out primary button, a broken
OTP input where backspace didn't delete + step back) **while the automated
verifier stamped PASS** on the builder's own "matches export" claim. Root cause
= two classes: **FC2 (fidelity gap)** — "port from export" was interpreted as
*re-implement the look in fresh Tailwind by reading the export*, which reproduces
the skeleton but silently drops elements + gets the theme wrong (~80%); and
**FC3 (toothless verification)** — the gate was the builder's unverified claim,
no assertions, no human eyes.

**The pivot — approach B: consume the export as CODE, don't re-draw it.** When a
frozen client-approved export exists (Claude-Design export:
`tokens.css`/`components.css`/`components-<domain>.css` + `kit.jsx` components +
`screens-*.jsx`), the build now **adopts it verbatim**: bring the export's real
CSS into the app, port the kit components **keeping the exact classNames** so the
CSS applies, rebuild each screen from its `screens-*.jsx` structure, and wire
only real data/routing/API. **Evidence it works:** the elearning fix (commit
*re-base auth screens on the frozen prototype export* — verbatim CSS +
components, real data) reached **~99% by construction** where the re-draw sat at
~80% with heavy eye-tuning. The LLM re-drawing step IS the fidelity-loss step —
it is removed. The old "reconcile-and-rebuild-in-our-own-Tailwind" wording is
quoted in `build-execution.md` as the FAILURE.

**Toothy verification (FC3).** The visual-fidelity gate's teeth are now
**machine-checkable, not an LLM opinion**: (a) **per-screen Playwright
assertions** — element completeness (every element/icon/link/toggle the
prototype screen has is present in the built DOM) + interaction behaviour (e.g.
OTP: type fills+advances, backspace deletes+steps back, paste fills, submit
disabled until valid) — a dropped element / wrong interaction = a RED test; and
(b) a **human side-by-side glance** at the built screenshot vs the prototype
image **before the phase closes**. The builder's "self-certifies matches export"
is killed. Stated plainly in the gate: an LLM comparing two screenshots is
unreliable + biased toward "same" — the machine tooth is the assertions, the
human judges only aesthetics. The kit is adopted + operator-signed **once** (a
P0.5 / walking-skeleton leg) so per-screen theme+components are correct by
construction and the glance stays a quick check that scales to many screens.

- **`docs/playbooks/build-execution.md` § Prototype → Code Fidelity** — flipped
  from "port-first (rebuild-in-our-Tailwind)" to **"consume the export as code —
  do NOT re-draw"**; the 4-step adopt rule (bring CSS in · port kit keeping
  classNames · rebuild screens from `screens-*.jsx` · wire only real data);
  old approach quoted as the ~80%/OTP-backspace failure; fallback = design-system
  build when no export covers the screen; Related + FC6/FC7 pointers.
- **New playbook `docs/playbooks/prototype-export-adoption.md`** — the
  step-by-step adoption method + when it applies (frozen export exists → adopt)
  vs the fallback (no export → design-system rebuild) + kit-first ordering.
  Registered in `docs/playbooks/README.md`.
- **`docs/gates/visual-fidelity.md`** — rewritten toothy: Tooth A (Playwright
  element + interaction assertions, RED = block) + Tooth B (human side-by-side
  glance before phase-close); explicitly does NOT rely on agent self-cert or LLM
  image-compare; auto-block on missing/RED assertions or missing glance;
  per-screen table gains fidelity-spec + assertions + glance columns.
- **`docs/templates/build-manifest.md`** — screens carry a **Fidelity contract
  (executable, not prose)**: required-element + interaction assertions to encode
  as a Playwright fidelity spec; strategy renamed `port from export` →
  `adopt from export`; visual-fidelity acceptance category = assertions green +
  glance approved; coverage-checklist rows updated. **`.claude/commands/build-phase.md`
  step 4/5** — the packet says adopt-as-code + encode fidelity assertions; the
  acceptance leg RUNS the assertions + captures the screenshot (no LLM
  image-compare).
- **FC6 + FC7 control rules** (`docs/HARNESS.md` § Control-Plane Failure
  Classes, referenced from `build-execution.md`): **FC6** — verify at the real
  source, never trust a wrapper exit/signal (evidence: a `git push … | tail`
  reported exit 0 while git actually REJECTED the push and the orchestrator
  relayed false success); **FC7** — make human review real: surface the built
  screenshot side-by-side, don't accept a blind rubber-stamp.
- **Wiring:** `docs/HARNESS.md` Growth-Rule latest = v6; `docs/STAGE_GOALS.md`
  2.6 + `docs/WORKFLOW.md` fidelity references updated to assertions + glance.
  **Independence Principle intact** — Playwright already ships in the stack; no
  new hard `ck-*` dependency (adoption engines are `frontend-development` /
  `ui-styling` accelerators with bare-agent fallbacks).

## v5.2 — 2026-07-10 — install embeds the stack template (INSTALL gap fix)

`install-harness.sh` shipped the harness skeleton into a project but never
placed the stack template anywhere the project could actually reach it: step
2.4 (`docs/STAGE_GOALS.md`) told scaffold to pull `templates/stack-pnpm-nest-next/`
"from the harness source — local clone or repo tarball", but nothing told the
*installed project* where that source was once the installer had finished and
moved on. **Field evidence (elearning-platform):** at scaffold time the
template wasn't reachable, so the build agent hand-built an equivalent
scaffold and re-implemented tier-2 (queue/storage) instead of reusing the
shipped, red-teamed `packages/queue-core` / `packages/storage-core` — defeating
the entire point of shipping proven template code.

- **`install-harness.sh`** now embeds the stack template into
  `<target>/.harness/stack-template/` on every install (normal, `--bootstrap`,
  and re-install/upgrade) — source only, `node_modules`/`dist`/`.turbo`/`.next`/
  `pnpm-lock.yaml` excluded. `.harness/` is harness-owned (never
  project-authored): each run wipes and recopies it wholesale so a stale
  `TEMPLATE_VERSION` never lingers. Honors `--dry-run` (lists what would be
  embedded, writes nothing). Appends `.harness/` to the target's `.gitignore`
  (creates the file if absent) so the embed is never committed into the
  project's own repo — done before the bootstrap baseline auto-commit.
  `STAGE.md` Snapshot § Harness source now also records the embedded path +
  `TEMPLATE_VERSION` when bootstrap fills it.
- **`docs/STAGE_GOALS.md` step 2.4** + **`docs/templates/build-manifest.md` P0
  block**: scaffold's PRIMARY path is now the embedded copy
  (`.harness/stack-template/scripts/scaffold.sh <target> <slug>`); the
  harness-source clone/tarball is a fallback only for a missing/stale embed. A
  hand-built equivalent scaffold is now explicitly a last resort that must be
  recorded as a decision (`docs/decisions/<slug>.md`) — the exact
  improvisation risk this fix removes.

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
  (`StorageAdapter { put; signedGetUrl; signedPutUrl; delete }`, drivers `s3`
  (AWS S3/R2/MinIO — one driver, endpoint-selected) + `local` (filesystem,
  dev-only)), worker `apps/worker/`; Redis/MinIO opt-in compose profiles.
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

## v5.1 — 2026-07-10 — red-team fixes on v5's tier-2 primitives

A focused fix round on v5's non-CRUD stack code + playbooks, closing the gap
between what the docs claimed and what actually shipped:

- **MinIO now a real tier-2 service** (`docker-compose.yml`, `minio` + a
  `minio-mc` bucket-init one-shot) — the `object-storage`/`media-pipeline`
  signed-URL/entitlement ACs were previously undocumented as runnable
  (the doc claimed a `minio` compose profile that didn't exist). `.env.example`
  + `object-storage.md` corrected: `minio` is the `s3` driver pointed at a
  local endpoint, not a separate "local/minio" driver.
- **media-pipeline.md's ffmpeg command synced** to the actual
  `hls-ladder.ts` output (`<label>/playlist.m3u8` + `master.m3u8`; the doc
  previously showed a never-shipped `hls/%v/index.m3u8` shape).
- **`JobStatus.result`** (BullMQ `returnvalue`) added end-to-end — the
  `async-job-queue.md` primitive line already promised it; the type/impl
  didn't carry it. `queued` state wording fixed to BullMQ's real
  `waiting | active | completed | failed` everywhere it appeared.
- **Transcode source-expiry fix**: the worker downloads the signed-GET source
  to a local tmp file before invoking ffmpeg, so a multi-hour transcode can't
  403 on a source URL expiring mid-run.
- **Audio-optional ffmpeg map** (`-map 0:a:0?`) — a silent/screen-capture
  upload no longer fails the whole transcode job.
- **Atomicity truth**: on an upload-loop failure the worker best-effort
  deletes every rendition/segment key it attempted to write (no orphaned
  partial ladder); the playbook + phase-acceptance gate now say explicitly
  that a consumer must gate on job `completed`, not "the manifest key exists"
  — there is no automatic stage→atomic-publish.
- **Idempotency retention caveat** documented: dedup only holds within
  BullMQ's completed/failed retention window (`queue-factory.ts`).

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
