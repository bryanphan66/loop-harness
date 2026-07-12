# Harness

The **videcode-harness** is a reusable operating model that lets a solo dev (with
agents) turn a raw client lead into safe, validated, accepted, maintained
software across **3 macro-stages** — Pre-Build, Build & Go-live, Post-Build.

The app is what the client touches. The harness is what agents touch.

## Three-Layer Architecture

The harness is the **control plane** that drives an **engine** of artifact
producers, executed by **role players**.

| Layer | Role | Components |
|---|---|---|
| **Control plane** | decides *what runs next* + *did the gate pass* | `STAGE.md`, the canonical gates (`docs/WORKFLOW.md`), the verify-gate hook (`scripts/harness-verify-gate.sh`), stage-boundary commits, the `stage-runner` orchestrator + `/stage-next` |
| **Engine** | *produces* the artifact each step | the `ck-*` skills (live, **invoked** — never vendored) + `cook` / `ship` / `deploy` / `devops` |
| **Role players** | *execute* each SDLC role's work | the global agents (planner, researcher, fullstack-developer, code-reviewer, tester, debugger, ui-ux-designer, docs-manager, project-manager, git-manager, code-simplifier, journal-writer, brainstormer), orchestrated by `stage-runner` |

The control plane is portable and self-contained. The engine and role players are
**accelerators**: a bare agent reading the playbooks can play every role and
produce every artifact without any `ck-*` skill.

Full role → engine binding: `docs/ROLE_MAP.md`. Step-by-step map:
`docs/WORKFLOW.md`.

## Independence Principle

The harness must function with only:

- An agent that can read/write files and run shell commands (Claude Code,
  Cursor, Continue, or a human reading the docs).
- Git and bash (for `scripts/install-harness.sh`).

The `ck-*` skills are the **live engine** the harness invokes — but they are
**accelerators, not dependencies**. The harness must still be runnable on a bare
agent + git + bash.

Specifically:

- `AGENTS.md`, `STAGE.md`, `docs/WORKFLOW.md`, `docs/HARNESS.md`,
  `docs/TRACE_SPEC.md`, and `scripts/install-harness.sh` MUST NOT reference any
  `ck-*` skill as a **required** step.
- `install-harness.sh` **preflight-checks** that `~/.claude/skills` and
  `~/.claude/agents` exist and **WARNS if missing** — it never copies them into
  the project repo.
- Playbooks reference `ck-*` skills only in their **Engine** / **Related**
  sections as the fast path. Every playbook's core logic must be executable by a
  plain agent — the skill is enrichment, not gating.

When an agent finds a playbook, template, or plan that mandates a `ck-*` skill
before it can run, treat it as a **defect** — refactor the file or open a backlog
entry. Decision record: `docs/decisions/ck-skill-engine-not-vendored.md`.

## How ck-Skills Bind As Engine

For each step, `docs/WORKFLOW.md` names an **Engine** (a `ck-*` skill or a global
agent). At run time:

1. `install-harness.sh` already ran the preflight. If `~/.claude/skills`
   exists, the named `ck-*` skill is the **fast path**.
2. `stage-runner` invokes the skill to produce the step's artifact at the path in
   `docs/WORKFLOW.md`.
3. If the skill is **absent** (preflight warned), the role's global agent runs
   the playbook's core logic instead and produces the same artifact shape.

The skill never owns the contract — the **artifact path + shape** in
`docs/WORKFLOW.md` and the **token grammar** in `docs/TRACE_SPEC.md` are the
contract. The skill is one way to fill it.

## Source Hierarchy

```text
client lead / user-provided spec
  input material for Pre-Build

docs/requirements/*            (BA spine: SRS + REQ-ID + RTM + use-cases + glossary)
  the requirements contract

docs/scope-baseline/*          (feature-register + scope matrix)
  the frozen scope contract (PB-G2)

docs/visuals/prototype/*       (full-function prototype)
  the frozen visual contract (PB-G3)

docs/decisions/*               (ADR by stable slug)
  why the contract changed
```

Before build, these docs describe intent. After build, the same docs plus
executable tests (TC-NNN) become the living contract agents update as the system
evolves.

## Playbook Lifecycle

Every playbook carries a lifecycle status so readers know whether the guidance
was exercised on real work or is still a paper proposal. The status is a single
grep-able line near the top:

```markdown
**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none
```

| State | Meaning |
|---|---|
| `experimental` | Shipped but not yet exercised on a real step. Treat as proposal. |
| `verified` | Used on ≥1 real step with no Variant amendment required. Safe to follow as-is. |
| `deprecated` | Superseded by a newer playbook, or accumulated 2+ Variant amendments without convergence. Do not start new work from it. |

Promotion / demotion:

- `experimental` → `verified`: 1 step used it successfully without a Variant
  section, OR 2 steps used it (minor Variant sections allowed).
- `verified` → `deprecated`: superseded by a newer file, OR 2+ Variant sections
  point to systemic issues.

Update the `First use` and `Verified by` fields on promotion. Keep the line as a
single sentence so `grep -l "experimental" docs/playbooks/` returns the current
candidate set.

## Coverage

All three macro-stages are **built fully**: step tables + gates
(`docs/WORKFLOW.md`), per-step goal text (`docs/STAGE_GOALS.md`), templates and
playbooks. Macro 2 executes through the **build-manifest** (compiled at 2.3
from the frozen spec) and the **`/build-phase` loop** (one manifest phase per
isolated invocation) on top of the **walking-skeleton stack template**
(`templates/stack-pnpm-nest-next/` in the harness source, scaffolded at 2.4).
Macro-1 weight is lane-scaled (`docs/WORKFLOW.md` § Lanes: Full vs Lite).

Conditional enterprise gates (data-migration/cutover, NFR/load, DR + RTO/RPO,
compliance/privacy/WCAG, observability/SLO) live mostly in Build & Go-live and
Post-Build. Each must be explicitly marked **N/A by decision** when not needed —
never silently dropped.

## Status Artifact — the human tracking surface

The reports under `plans/reports/` are the machine's memory — dense, per-phase,
read on demand. The human running the build needs the opposite: **one glanceable
page that is always current**, so tracking progress never means scrolling a
transcript or opening files. That page is a **status Artifact** — a self-contained
hosted dashboard, anchored to the session, that the operator bookmarks and the
team can be shown.

Practice:

- **Stand it up early** (once the dev preview is live / the first real phase
  lands), not at the end — its value is watching the build *in progress*.
- **Refresh it at every milestone** — each gate cleared, each phase deployed,
  each harness-version bump. Re-publish the SAME file so the URL is stable; the
  operator's bookmark never breaks.
- **Contents** (a UI to scan, not a doc to read): live service checks (verified
  at source, not a CI badge — each service URL a **clickable link that opens the
  live app in a new tab**, so the operator jumps straight from the dashboard to
  the running thing), delivered capabilities with state chips
  (live / building / parked), the harness lessons locked this run, run parameters
  (repo, branch, stack, current SHA, blockers). Summary before detail; state
  encoded in form (dots, chips) so what needs attention reads at a glance.
- **It mirrors truth, never narrates ahead of it** — a capability is "live" only
  when its live check passes, matching the verify-at-source rule (FC6). It is a
  view over the same facts the gates enforce, not a second source.

- **Speak the operator's language.** The status Artifact is read by the human, so
  it is written in *their* language, not the codebase's English — glossing
  technical/English terms inline when the operator is still learning them. (The
  reports and code stay in the project's canonical language.)

The status Artifact is the operator's cockpit; the reports are the flight
recorder. Both are kept; they serve different readers.

### Two surfaces — internal ops-board vs client-facing roadmap

The status Artifact above is the **internal ops-board**: full engineering truth
for the *team* — phase IDs, SHAs, harness versions, deploy state, gate results,
the operator's-language gloss. It reveals everything.

A client must never be handed that surface. So the harness keeps a **second,
separate Artifact — the client-facing roadmap** — a *curated* view the delivery
side controls, aligned with Locked Decision **D4** (client-facing surfaces are
forked + localized; internal technical artifacts stay English). It is the same
truth, filtered and reframed for the buyer:

| | Internal ops-board | Client-facing roadmap |
|---|---|---|
| Reader | The team | The client |
| Language | Engineering + operator gloss | Clean business language, **zero internal jargon** (no phase IDs, SHAs, harness versions, stack terms) |
| Unit | Per-phase (P0…Pn) + gates | **Value groups** (business capability buckets) + SOW milestones + dates |
| Progress | Exact phase count / % | Same honest %, positively framed (foundation + core first) |
| Blockers | Every FC / OQ, technical | Only the ones **the client must act on**, phrased as a courteous action item |
| Control | Raw, mirrors truth | **Curated** — the delivery side decides what the client sees |

Curation rules (so the client surface stays honest AND clean):
- **Never inflate.** The % and "delivered" states are the same verified facts as
  the ops-board (FC6). Reframing is allowed; lying is not.
- **Group by value, not by phase.** Collapse the P-list into business buckets the
  client recognizes (accounts, courses, payments, certificates, …). A bucket's
  state is the roll-up of its phases (delivered / in-progress / upcoming / waiting).
- **Strip the machine.** No phase numbers, commit SHAs, harness versions, gate
  names, or stack nouns (HLS, authz, dnd-kit…) — say the capability, not the tech.
- **Surface only client-owed blockers**, as a "what we need from you" callout
  (e.g. legacy-DB credentials for migration), framed so it does not read as our delay.
- **Timeline in SOW dates**, milestone-level.
- **Separate file → separate URL**, published + kept stable independently of the
  ops-board; refreshed at the same milestones.

**Ownership / handoff (team model).** The client roadmap is a **PM-role
deliverable**: the PM compiles it from the same verified state, and the **CS
(customer-success) role forwards it to the client** as the progress attachment.
The PM controls curation; CS controls delivery. In a solo run the operator wears
both hats but the two surfaces stay distinct — the internal board is never the
thing sent out.

## Locked Decisions

Shorthand labels cited across the docs (`D1`…`D6`). These are settled — an
audit or refactor does not silently reverse them:

| # | Decision |
|---|---|
| **D1** | Independence Principle — `ck-*` skills are accelerators, never dependencies; the harness runs on a bare agent + git + bash. |
| **D2** | Balanced process — enterprise gates are **conditional**: cleared or explicitly `N/A by decision`, never silently dropped. |
| **D3** | Token scheme — `GAP-NNN → REQ-ID (MODULE.AREA.NN) → SC-NNN → TC-NNN`, `CR-NN`; `US-NNN.REQ-MMM` is not used. |
| **D4** | Bilingual split — client-facing surfaces fork to `locale-vi/`; internal technical artifacts stay English; IDs/paths/code stay EN everywhere. |
| **D5** | SA and Tech Lead are separate named roles (ERD freeze vs stack/API/threat-model). |
| **D6** | Engine is preflight-checked, never vendored — `install-harness.sh` warns about missing skills/agents but never copies them. |

## Growth Rule

The harness grows from friction. When an agent is confused, repeats manual
reasoning, finds a missing rule, or hits a recurring failure, it must improve the
harness directly or record the friction. The capture mechanism is the **Friction**
field in every session trace (`docs/TRACE_SPEC.md`); friction that should become
work graduates into a plan or a decision. Harness-version changes are logged in
`docs/HARNESS_CHANGELOG.md` (one entry per hardening round, naming the failures
it closes) — latest **v6.13** (a ported screen must be the WHOLE design, not a reduced gist: every filter/toolbar control present + wired (a dropped select is a lost feature), shared chrome (utility top-strip, multi-column footer) ported at full fidelity not a stub, and a kit component rendered in the SAME variant the export picked for that screen (light nav where the export is light, not the dark on-ink variant) — size-S is not licence for a lossy port (U10); prior **v6.12**: a typed entity — a lesson `video|text|pdf`, any `type`/`kind` enum with SRS-distinct content — must render PER TYPE: the editor branches on the enum and surfaces each value's real content (video asset / rich-text body / PDF), never the single variant the prototype happened to draw defaulted onto all (U9); prior **v6.11**: a working native browser primitive is NOT the adopted design: a native `<video controls>` grey bar where the export shows a designed player (poster + center play + res/duration badge), or a `window.prompt` where it shows an in-app dialog, is redraw-by-omission (U8) — adopt the designed control, native only where the export shows it; and a transcode ladder never upscales — probe source height, emit only rungs ≤ source (≤480p → one 480p rung, no fake 720/1080), badge/DB carry the real max height; prior **v6.10**: authz isn't finished at the API: the Security floor grows two legs — every admin screen gates its mutating controls (delete/publish/create) on the caller's fresh grant surfaced via `/auth/me`, hidden by default, verified alongside the route's 403 so a guarded route with an ungated button is a defect; and any RBAC matrix refuses to lower the ceiling-defining admin role's own grant below its current level, client + save-API, so an operator can't drop the ceiling and self-lock the system — with the idempotent boot seed as the documented recovery; prior **v6.9**: the status surface splits in two: the internal ops-board stays the team's full-truth cockpit, and a separate **curated client-facing roadmap** — value buckets not phase IDs, machine tokens stripped, one honest positively-framed %, SOW-date milestones, only client-owed blockers as a courteous callout — becomes a PM deliverable the CS role forwards to the client; same verify-at-source facts, two readers, two stable URLs — `playbooks/status-surfaces-ops-and-client.md` owns the phase→value-bucket recipe + curation checklist; prior **v6.8**: interactive-UI floors: any drag-reorder uses a real DnD primitive with a keyboard sensor and the gate asserts sort_order persists across reload in BOTH directions — the hand-rolled down-direction no-op is auto-blocked (U5); object-page breadcrumb non-last crumbs are navigable links, not dead text (U6); a ported export screen's baked-in fixed max-width is reconciled against the shell content column as a legitimate deliberate deviation — the fidelity gate grew interaction teeth alongside its visual ones after a screen matched the export pixel-for-pixel yet was operationally broken; prior **v6.7**: front-load the cross-cutting floors: per-phase verifier gains Leg-5 Universal-UI (shared fidelity fixture, inherited not re-copied), Leg-6 Security (default-deny authz + fail-closed secrets), Leg-7 Index-discipline — the machine proves the whole class in-phase, the human confirms; Status Artifact: a live, always-current human tracking dashboard refreshed at each milestone — cockpit to the reports' flight recorder; Regression Ledger: every noted-and-fixed UI defect becomes a permanent machine assertion so it never returns as the run continues; UI phases carry the SRS-mandated cross-cutting NFRs
— i18n VI+EN + responsive ≥375px — as DoD with machine assertions, not just the
frozen desktop-single-language look; the stale-export trap: the local export is a
CACHE, not the source of truth — pin the live Claude-Design project + version and
re-pull/diff local-vs-live before adopting, else a faithful adoption ships the
wrong, drifted design; adds four universal fidelity assertions — U1
app-shell-present, U2 input-focus, U3 theme-fidelity-in-both-modes so a scaffold
`globals.css` can't silently override the adopted export tokens, U4
shell-stays-put on scroll — a both-theme human glance, and the app-shell as a
P0.5 foundation; on top of v6's
toothy visual-fidelity gate: adopt the frozen
prototype export **as code** instead of re-drawing it, per-screen Playwright
fidelity assertions + a human side-by-side glance replace the builder's hollow
"matches export" self-claim, plus control-plane rules FC6 (verify at the real
source) + FC7 (make human review real)).

## Control-Plane Failure Classes

Recurring build failures are classified so the harness fixes the **class**, not
the instance (full taxonomy + evidence in `docs/HARNESS_CHANGELOG.md`). Two are
control-plane rules every orchestrator + verifier obeys:

- **FC6 — verify at the real source, never trust a wrapper signal.** A tool's
  own output/state is the truth — not a shell wrapper's exit code, a `| tail`'d
  tail, or a relayed "exit 0". **Evidence:** an orchestrator reported a push as
  `exit 0` off a `git push … | tail` pipeline while `git push` actually returned
  1 (the remote **rejected** it) — the pipe masked the real exit and false
  success was relayed. Rule: read the operation's real result (git's own
  stderr/`git status`/the remote ref; a health endpoint's `.status`, not an HTTP
  200; the running artifact's version, not a green CI run). A gate that checks a
  wrapper instead of the source is toothless.
- **FC7 — make human review real; no rubber-stamp.** A checkpoint that asks the
  operator to "approve" without **surfacing the artifact** produces a blind OK.
  Every human gate MUST surface what it is asking about — for UI, the built
  screenshot **side-by-side** with the prototype image (`docs/gates/visual-fidelity.md`
  Tooth B). The machine teeth (assertions, source checks) do the heavy lifting;
  the human judges only what a machine cannot (aesthetics), and only when it is
  actually put in front of them.

## Traceability Tokens

Pointer only — the full grammar, chain, and RTM completeness rule live in
`docs/TRACE_SPEC.md`. In short: `GAP-NNN → REQ-ID (MODULE.AREA.NN) → use-case +
RTM row → SC-NNN → feature-register line → SOW line → TC-NNN`, with `CR-NN` for
change requests. **`US-NNN.REQ-MMM` is not used** in this harness.

## Project Doc Mapping

The harness organizes information into process-folders (discovery, intake,
requirements, scope-baseline, visuals, design, stories, decisions). The
global-`CLAUDE.md` convention expects a fixed set of doc names. The crosswalk —
which harness folder backs each expected doc, and which is a living contract vs a
derived view — lives in `docs/README.md`. When in doubt, the harness layout wins.
