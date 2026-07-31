# Red-Team Report — Videcode Macro-Harness Transfer Readiness

## 1. Verdict

**NO — not safe to transfer to a fresh dev for a new project as-is.** The harness is a genuinely good *methodology* and a disciplined operator on the exact proven stack (pnpm/Nest/Next) will get real value from it. But its headline promise — "gates form a defect floor; run it → a running, hasi-hub-quality app" — is **not mechanically true**. The two flagship gates it sells as "internal HARD gate (auto-block)" (phase-acceptance Legs 1-27 at `harness/docs/gates/phase-acceptance.md:2`; visual-fidelity U1-U19 at `harness/docs/gates/visual-fidelity.md:3`) are executed by an LLM verifier subagent that the orchestrator *voluntarily* spawns inside a *voluntarily-typed* `/build-phase`. The only non-bypassable mechanism, the git hook `harness/scripts/harness-verify-gate.sh`, runs exactly four weak checks (lint/typecheck, register-token scan, STAGE atomicity, floorplan string-presence) and touches not one Leg or U-number. The "machine teeth" the fidelity gate repeatedly cites (`scripts/check-*.mjs`, `lint:gates`) **do not exist anywhere in the repo** despite `HARNESS_CHANGELOG.md:82` claiming "six lint:gates scripts" ship. The proof is in the harness's own history: on the *one* project it was built for and run cooperatively through the full flow, the **human — not any gate — caught ~10 defects** that are the exact classes these gates claim to auto-block (nav link to 404 = Leg-9; bell "view all" to wrong page = U13; tab-closing back button; invisible-headline effect). A fresh dev who trusts the "defect floor" marketing and skips manual QA will ship the same class of defect. It becomes transfer-ready only after the "Enforcement gap" fixes below convert the highest-value gates into checks a fresh dev cannot skip, and the docs stop labelling honor-system prose as "auto-block."

---

## 2. Top Risks (deduped, ranked)

### CRITICAL

**C1 — The flagship "machine teeth" are vaporware; the fidelity floor ships as prose only.**
- *Evidence:* `harness/docs/gates/visual-fidelity.md:349/365/382/415/441/453` cite `scripts/check-dead-affordance.mjs`, `check-inline-grid-reflow.mjs`, `check-icon-registry-coverage.mjs`, `check-primitive-inline-style.mjs`, `check-prototype-copy-verbatim.mjs`, `check-toast-convention.mjs` as the `lint:gates` auto-block; `phase-acceptance.md:84-119` makes `apps/web/e2e-ui/_universal.fidelity.ts` a mandatory import. `find harness -name 'check-*.mjs'` = 0; no `lint:gates` in any `templates/**/package.json` (web `lint` is just `pnpm -r lint`); no `e2e-ui/` dir, no `_universal.fidelity.ts`. `pre-demo-self-qa-checklist.md:54` even tells the agent to run one of these nonexistent scripts.
- *Fresh-dev failure:* `pnpm run lint:gates` → "Missing script". The single most-advertised anti-regression class (dead-affordance — the exact seed 404/bell defect) has **zero shipped teeth** in a new project; the gate silently collapses to a human eyeball the fresh dev may not know to apply.
- *Fix:* Ship the referenced scripts + the universal fixture + a `lint:gates` npm task **inside** `templates/stack-pnpm-nest-next` so `install-harness.sh` materializes them, and wire `lint:gates` into `harness-verify-gate.sh` Gate 1; add an install preflight that `pnpm run lint:gates` resolves. Until shipped, relabel U13-U19 `experimental`, not "machine tooth / auto-block."
- *Type:* **auto-check** (+ doc honesty in the interim).

### HIGH

**H1 — The only non-bypassable gate never runs the acceptance floor, the test/e2e suite, or the fidelity specs.**
- *Evidence:* `harness/scripts/harness-verify-gate.sh` whole file — `run_validate()` iterates only `validate|lint|typecheck|check` and breaks on first match (root has no `validate` script → resolves to `pnpm -r lint`, ESLint only); it never runs `test`/`e2e`, never invokes any Leg or U-check. `AGENTS.md:247-253` itself concedes the hook only does lint/validate + register. CI (`.github/workflows/ci.yml`) runs vitest + api e2e but **never** web `e2e` where Playwright fidelity assertions live. `visual-fidelity.md:140-142` claims assertions "run in `validate:quick`… so they gate every commit" — but `validate:quick` is **defined nowhere** in the harness.
- *Fresh-dev failure:* A screen whose Playwright fidelity spec is RED (dropped logo, broken OTP backspace — the literal elearning P1/P2/P3 failure the gate cites) commits and pushes green; the one genuinely mechanical fidelity mechanism has no gate wired to it.
- *Fix:* Add the phase's fidelity/e2e specs to the hook's mandatory run on phase commits, or require a verifier-produced green Playwright run-id as a register field the hook validates.
- *Type:* **auto-check.**

**H2 — Register gate is self-report-only and blind to MISSING verification; a phase that ran zero checks passes "clean."**
- *Evidence:* `harness-verify-gate.sh` `check_register()` emits a violation only when a Result cell equals literally `fail` (`never-run` only at stage-close); a register with zero data rows prints "register clean" and returns 0. No check that a TC/REQ-ID/screen row **exists**. The agent writes its own `Result: pass` (`build-phase.md:94`). Leg-26's committed-vs-executed spec-count reconciliation (`phase-acceptance.md:377`) is labelled "Machine-check" but nothing executes it.
- *Fresh-dev failure:* Add no register rows (or fabricated `pass` rows) → hook greenlights. The "defect floor" reduces to "whatever the agent chose to self-certify about its own work," and no agent writes `fail` about code it just shipped.
- *Fix:* Require ≥1 `pass` row mapped to each REQ-ID/screen the commit touches; run the executed-vs-committed spec-count reconciliation before the hook goes green.
- *Type:* **auto-check.**

**H3 — Cross-stack hook silently disarms — and the harness's OWN recipes cause it.**
- *Evidence:* `harness-verify-gate.sh:49-56` self-check is fail-OPEN (only `say()` to stderr, never sets `fail=1`). The `.husky` re-chain that survives pnpm's `prepare: husky` exists **only** at `templates/stack-pnpm-nest-next/.husky/`. Worse: `docs/playbooks/build-execution.md` Pre-Commit Hook Recipe tells a fresh dev to `pnpm dlx husky init` (Node) or `pre-commit install` (Python) — both repoint `core.hooksPath` away from `.githooks` and run only lint-staged/pre-commit, never chaining `harness-verify-gate.sh`.
- *Fresh-dev failure:* On any husky/lefthook/pre-commit-framework stack (most JS + Python projects, exactly what the recipes recommend), the entire mechanical floor — even the 4 weak checks — is silently, permanently gone. The only signal is a stderr WARNING that, after drift, never even fires because the script is never invoked. Contradicts `AGENTS.md:247-260` "Verify Gate — No Bypass."
- *Fix:* Make the self-check FAIL-CLOSED when `core.hooksPath` is neither `.githooks` nor a path that provably chains the gate; have `build-execution.md`/`install-harness.sh` emit a chaining hook (prepend `bash scripts/harness-verify-gate.sh`) for whatever hooks-tool the chosen stack uses.
- *Type:* **auto-check** (+ recipe doc fix).

**H4 — `/gate-check` and `/build-phase` are LLM-executed prose, not deterministic gates; the whole per-phase apparatus is skipped by committing directly.**
- *Evidence:* `gate-check.md` frontmatter `allowed-tools: Read,Bash,Grep,Glob` + step 3 "check mechanically *where possible*"; `gates/README.md:19` lists WALKING-SKELETON as "(no file — mechanical)" but "asserted by /gate-check" (an agent reading markdown). `build-phase.md` Rules: "this command never auto-runs." Nothing forces `/build-phase` to be typed.
- *Fresh-dev failure:* An agent that implements → `git commit` (never typing the slash commands) is subject only to the 4 git-hook checks; route-reachability, IDOR, negative-path, all fidelity — skipped with no error. Even when invoked, an LLM interpreting "where possible" can rationalize a gate GREEN.
- *Fix:* Convert gate-clearing conditions to objective predicates (health-200, seeded-login, migration state, route registry) the hook/`gate-check` shells out to and whose exit code is authoritative — the pattern the git hook already uses.
- *Type:* **auto-check.**

**H5 — ~16-23 of 27 acceptance legs bake Prisma/Nest/Next/BullMQ/next-intl/helmet/Playwright primitives into the CHECK itself; the defect floor evaporates off-stack.**
- *Evidence:* `phase-acceptance.md` Leg-6:121 (Nest guard/`@Public`/helmet), Leg-11:251 (`next build`/`prisma migrate status`/BullMQ jobId), Leg-14:305 (next-intl ICU), Leg-16:367 (Prisma `select` allowlist), Leg-17:368 (`@Throttle`), Leg-21:372 (`PrismaClientKnownRequestError` P2002/P2025/`25P02`, Node `unhandledRejection`), Leg-22:373 (`@Cron`, `pg_try_advisory_lock`), Leg-27:378 (Next `standalone`, pnpm prune). The verifier subagent is handed "ONLY … this gate file" (Leg-1:34-39).
- *Fresh-dev failure:* On Go/Django/Rust — an **officially permitted** path via an ADR (`WORKFLOW.md:153`, `STAGE_GOALS.md:488`) — the verifier is told to grep for `@Cron`/`@Throttle`/`P2002` that don't exist, then either FAILs every phase or guts the legs wholesale, losing the portable intent (rate-limit exists, unique-violation → 409, migrations applied). Only ONE template ships; no adaptation layer.
- *Fix:* Split each coupled leg into a stack-neutral **INVARIANT** (gated) + a per-stack **RECIPE** appendix (example). Ship ≥1 non-TS recipe card before claiming any stack portability.
- *Type:* **doc/process** (structural refactor; no auto-check until a recipe exists).

### MEDIUM

**M1 — Gates miss defects even ON the web app they were fit to (intra-scope gaps).**
- *Evidence:* Leg-9 (`phase-acceptance.md:205`) claims to crawl every nav/CTA and block 404; U13 (`visual-fidelity.md:335`) claims to click every actionable element. Yet the harness's own memory (`harness-fidelity-gate-gap`) + the seed evidence record a human catching nav→404, bell "view all"→wrong page, tab-closing back, invisible headline — **all after the gates passed**. Leg-9(a) only proves the target isn't a 404; "wrong-but-resolving destination" is uncovered.
- *Fresh-dev failure:* Trusts the floor, skips manual QA on a different web app; the same PASS-stamp that shipped 10 defects on elearning ships theirs.
- *Fix:* Ship a real Leg-9 route-crawler + U13 dead-affordance lint as runnable scripts, and add a distinct "resolving ≠ correct destination" assertion.
- *Type:* **auto-check.**

**M2 — DoR hard-requires a frozen visual prototype + per-screen fidelity + design tokens with NO n/a escape.**
- *Evidence:* `dor-build.md:15/17/22` (Prototype frozen / Design approved-tokens+Component Coverage Matrix / Fidelity strategy per screen) carry no `n/a`; only line 23 does. Footer:40 "A failed line means Build does not start." Internal contradiction: `ui-design-system-contract.md:41` acknowledges non-visual stacks and says skip the contract, but that escape is never wired into DoR/DoD.
- *Fresh-dev failure:* A headless microservice / Kafka consumer can never check these true → build legally cannot start; the dev forges checkboxes or abandons. (Fails LOUD at the entry gate, not silently — hence Medium, not Critical.)
- *Fix:* Add explicit `[ ] N/A by decision — no UI (<reason> <date>)` toggles to those DoR lines, gated on a project-type profile, mirroring `dod-build.md`'s existing Conditional Enterprise Toggles.
- *Type:* **auto-check.**

**M3 — `ba-core-doc-bundle.md` mandates all 5 heavy BA artifacts with "no tiny lane — skip no part," directly contradicting WORKFLOW's Lite lane.**
- *Evidence:* `ba-core-doc-bundle.md:60-62` ("even a one-screen tool needs VISION_SCOPE + a use case + glossary + BPMN + RTM"), anti-pattern :299-300, Per-Tier table :302-308 (all tiers require all five, `grep -ic lite`=0). `WORKFLOW.md:40-42/:108` says Lite folds 1.3/1.4/1.6/1.7 into 1.5-lite. The bundle is linked as the "owner of 1.7" from `WORKFLOW.md:116` and `solo-dev-client-delivery.md:90`, and solo-dev:36 routes internal/OSS projects into the full sequence.
- *Fresh-dev failure:* A Lite-project dev opens the more-specific playbook, is told in bold to build the entire heavy bundle Lite was designed to skip — reproducing the #1 stated failure mode (Macro-1 bloat) on project #2.
- *Fix:* Add a Lite banner atop the bundle ("folded into 1.5-lite; do NOT run"), rewrite "no tiny lane" to defer to WORKFLOW § Lanes, add a Lite row to the Per-Tier table, same for solo-dev's flow.
- *Type:* **doc.**

**M4 — Shipped gate template is pre-filled with elearning's heavy numbers, and reads as pre-passed.**
- *Evidence:* `docs/gates/pb-g2-scope-frozen.md:21-25` every box `[x]` with 123 features / 166 REQ-IDs / SC-001..207; Sign-Off :36-42 filled with real names/dates. It is the **only** dirty gate file (pb-g1/g3/g4 are blank `[ ]` scaffolds; `srs-lite.md`/`STAGE.md` carry "Shape-only scaffold. Replace <placeholders>."). `gates/README.md:83-85` says `/gate-check` refuses to advance while any line is unchecked — pb-g2 has zero unchecked lines and a filled countersign.
- *Fresh-dev failure:* Copies it, treats 166/207 as the target bar (re-anchoring the bloat), or clears PB-G2 *vacuously* on another project's evidence, violating README:103 "Never check a line you cannot evidence."
- *Fix:* Ship pb-g2 as a blank shape-only scaffold; move the elearning-filled version to a labelled `docs/examples/` case study.
- *Type:* **doc.**

**M5 — Scaffold ships without a lockfile; the first fresh-dev step (2.4 skeleton boot) is non-reproducible.**
- *Evidence:* `install-harness.sh:337` excludes `pnpm-lock.yaml`; no lockfile committed (`TEMPLATE_VERSION` documents "No lockfile shipped" as a decision). Every `package.json` ships caret ranges (`@nestjs/*:^11`, `@prisma/client:^6.3`, `zod:^4`).
- *Fresh-dev failure:* The 2.4 gate (`install && build green · compose boots`) floats transitive versions; months past the verify date a peer/breaking bump can make the "verified-green" template fail install/build on day one, in code the dev didn't author. (Caught loudly at the gate — Medium, not High.)
- *Fix:* Ship `pnpm-lock.yaml` (or `.template`) and record the resolved node/pnpm toolchain.
- *Type:* **auto-check.**

**M6 — Phase Acceptance's independent verifier architecturally requires the Claude-Code Task multi-subagent tool; that coupling is undocumented against the advertised Cursor/Continue/bare-agent independence.**
- *Evidence:* `build-phase.md:4` hard-requires `Task`; step 5a:118-135 + :174 mandate a SECOND independent subagent "never the implementer"; `WORKFLOW.md:275` gate = "independent agent-verifier PASS." `HARNESS.md:29-31` advertises Cursor/Continue/"a human reading the docs" as valid runtimes — none have `Task`. `install-harness.sh` preflight never warns the acceptance floor is inoperable off the multi-agent stack.
- *Fresh-dev failure:* On a single-context agent, the same agent that wrote the code "verifies" it — the rubber-stamp the gate forbids.
- *Fix:* Mark the leg multi-agent-only, and/or document a degraded mode (fresh session re-invoked with only the gate file + phase block + preview URL, no implementation memory).
- *Type:* **process/doc.**

**M7 — Stack steering: STAGE 2.4 brands rolling your own stack a near-"defect" and the sole shipped template pushes non-TS devs toward Nest/Prisma/Next.**
- *Evidence:* `STAGE_GOALS.md §2.4` (template = "PRIMARY scaffold path"; hand-built equivalent = "LAST RESORT"; §2.2:422-424 asymmetric friction "choosing it needs one paragraph, deviating needs explicit NFR-based reasons"). Only `templates/stack-pnpm-nest-next` ships; tier-2 primitives (queue-core/storage-core) are TS-only, embedded unconditionally.
- *Fresh-dev failure:* A Go/Django dev reads the path of least friction as "abandon your stack." (The ADR carve-out exists, so a careful reader has a sanctioned path — Medium, not High.)
- *Fix:* Soften LAST-RESORT rhetoric for ADR-chosen stacks; ship a second reference scaffold or at least a standalone stack-neutral P0 "scaffold contract" (install/build green, compose boots, health 200, secret-scan clean) decoupled from the TS template.
- *Type:* **doc.**

### LOW (batch — real but narrow / loud-fail / doc-polish)

- **L1 Floorplan gate = string-presence only** (`harness-verify-gate.sh` `check_design_system`, blocks only empty/placeholder cells; any label incl. `CUSTOM` passes). Fix: pair with a real fidelity DOM assertion. *doc.*
- **L2 `resolve-plan-anchors` lint is described-but-absent** (`build-execution.md:401`; no script; `dor-build.md`/`code-review-scoring.md` never gain the promised lines). Improvisation caught late by Leg-1/Leg-16, not pre-flight. Fix: implement as a real orchestrator-shelled script failing closed at `build-phase` step 3. *auto-check.*
- **L3 Grid-completeness (Leg-8) + index-discipline (Leg-7) mandatory for the silent-default `crud`** (`phase-acceptance.md:187-204,183-186`; no scale-flag escape) — over-engineers a fixed 8-row list, contradicting the harness's own YAGNI rule. Fix: gate behind a declared "record-grid at scale" flag. *auto-check.*
- **L4 `WORKFLOW.md:348` + `TRACE_SPEC.md:7-9/75-76` claim "the verify-gate reads the RTM rule"** but the script has zero REQ-ID/SC-NNN/RTM parsing — an orphan high-risk requirement passes green. Fix: correct the docs to "manual playbook checklist," optionally add a lane-aware RTM presence check. *auto-check.*
- **L5 No explicit default lane** (`STAGE_GOALS.md 1.2`, `WORKFLOW.md § Lanes` state no default; Full route is the prominent table). Bloat reproduces by prominence bias. Fix: state "Lite is the default; Full only for external paying client," reshape STAGE.md so Lite is primary. *doc.*
- **L6 Phase-type enum has zero non-web categories and silently defaults to `crud`** (`build-manifest.md:61`) — an ETL/ML/CLI phase is mislabeled; pipeline defect classes (schema contract, idempotent reprocess, row-count reconciliation) have no leg. (Web floors are artifact-conditional so no false-block — Low.) Fix: explicit project-type selector + ≥1 non-web profile, OR scope the guide to "web/CRUD apps only." *doc/auto-check.*
- **L7 DoD's non-waivable field-by-field user manual has no N/A escape even in Lite** (`dod-build.md:34`) — meaningless for a UI-less lib/service. Fix: tie to a `delivery-mode` profile. *doc.*
- **L8 Lite still mandates up-front floorplan classification + per-screen state contracts for every grid/form screen** (`WORKFLOW.md:47-61`) — documentation-before-code that scales with screen count. Fix (surface as a proposal — floorplan is a user-confirmed non-negotiable): defer classification into each build-manifest phase block. *process.*
- **L9 Independence Principle is silent on STACK independence** (`HARNESS.md:27-52` scopes it to ck-skills only) — a reader may infer stack-agnostic. Fix: add a "Stack Independence" subsection + portability matrix (stack-neutral: macros/stage model/DoR-DoD skeleton/trace/register/Gates 1-3; TS-bound: template/~23 legs/fidelity/design-system). *doc.*
- **L10 Only documented run-loop is Claude-Code slash commands + Task** (README, `MACRO-2-GUIDE.md:94-110`); no by-hand procedure though Cursor/Continue are named as supported. Fix: add `docs/RUN-BY-HAND.md` mapping each command to Read/Edit/Bash steps, or drop the non-CC runtimes from the claim. *doc.*
- **L11 `install-harness.sh` preflight + printed `/goal` next-step are Claude-Code-first** (`:159-160,:186,:1027-1038`), signaling ck is the designed path. Fix: make preflight/next-steps agent-neutral, frame skills as "optional accelerators." *doc.*
- **L12 build-phase 25-turn budget + minimal packet** (`build-phase.md:164`) can truncate a phase on a heavier stack; the only catch is the verifier, which shares the missing-fidelity-machinery gap. (Mitigated: completion gated on checkbox-flip, not turn count — Low.) Fix: treat "no machine assertions present" as RED, not PASS. *auto-check.*

---

## 3. Enforcement Gap — Honor-System vs Auto-Run

**What actually runs mechanically** (the git hook `harness-verify-gate.sh` via `.githooks/pre-commit,pre-push`), and nothing else non-bypassable:
1. `pnpm -r lint` (ESLint) — and only if a matching script is found.
2. Verification-Register token scan — blocks a literal `fail` row; blocks `never-run` at stage-close.
3. STAGE.md/ROADMAP.md atomicity.
4. Floorplan cell string-presence.

**Everything the harness sells as its differentiator is honor-system prose an LLM narrates:**

| Claimed gate | Doc label | Actual mechanism | Enforced? |
|---|---|---|---|
| Phase-acceptance Legs 1-27 | "internal HARD gate (auto-block)" (`phase-acceptance.md:2`) | Verifier subagent, spawned only inside voluntarily-typed `/build-phase` | **Honor-system** |
| Visual-fidelity U1-U19 | "auto-block / machine tooth" (`visual-fidelity.md:3`) | `lint:gates` scripts that **don't exist** + a fixture that **doesn't exist** | **Vaporware** |
| `lint:gates` static teeth | "six scripts ship" (`CHANGELOG:82`) | No files, no npm task | **Vaporware** |
| Playwright fidelity specs | "gate every commit via validate:quick" (`visual-fidelity.md:140`) | `validate:quick` defined nowhere; hook runs neither `test` nor `e2e`; CI never runs web `e2e` | **Not run** |
| `/gate-check`, WALKING-SKELETON | "mechanical" (`gates/README.md:19`) | LLM reading a markdown table | **Honor-system** |
| resolve-plan-anchors lint | "orchestrator runs at phase start" (`build-execution.md:401`) | No script | **Vaporware** |
| pre-demo-self-qa-checklist | "verified by 182 defects" | Referenced by no hook/command/script | **Honor-system** |
| RTM traceability | "verify-gate reads the RTM rule" (`WORKFLOW.md:348`) | Hook has no REQ-ID parsing | **Not run** |
| Register completeness | "non-bypassable Pre-Close Gate" | Echoes an agent-written token; blind to absent rows | **Self-cert** |

**Conversion plan for the highest-value gates (a fresh dev cannot skip):**
1. **Ship the missing machinery** (C1): author `check-*.mjs` + `_universal.fidelity.ts` + a `lint:gates` npm task into the template so `install-harness.sh` materializes them into every project. Add an install preflight that fails if `pnpm run lint:gates` doesn't resolve.
2. **Wire them into the one non-bypassable hook** (H1/C1): `harness-verify-gate.sh` Gate 1 runs `lint:gates`; on a phase commit that touches app source, run the phase's fidelity/e2e specs (or require a verifier-emitted green Playwright run-id as a register field the hook validates).
3. **Make the register prove existence, not just absence-of-`fail`** (H2): require ≥1 `pass` row per touched REQ-ID/screen + executed-vs-committed spec-count reconciliation before green.
4. **Fail-closed hook self-arming** (H3): exit non-zero when `core.hooksPath` doesn't provably chain the gate; emit a chaining hook for the stack's hooks-tool; fix `build-execution.md` recipes to prepend the gate.
5. **Turn `/gate-check` clearing conditions into script exit codes** (H4): health-200, seeded-login, migration-state, route-registry — authoritative, not prose "where possible."

---

## 4. Hardening Backlog (by impact × ease)

### DO BEFORE TRANSFER
- [ ] **C1** Ship `check-*.mjs` + `_universal.fidelity.ts` + `lint:gates` into `templates/stack-pnpm-nest-next`; install-preflight asserts `pnpm run lint:gates` resolves. *(highest impact; the whole fidelity floor is currently fake)*
- [ ] **Doc-honesty pass (same PR):** stop labelling honor-system/absent mechanisms "auto-block / machine tooth" across `visual-fidelity.md`, `phase-acceptance.md`, `HARNESS_CHANGELOG.md:82`, `build-execution.md:401`, `WORKFLOW.md:348`, `TRACE_SPEC.md:7-9/75-76`. *(near-zero effort, stops fresh-dev false trust)*
- [ ] **H3** Make hook self-check fail-closed on drifted `core.hooksPath`; ship/generate a chaining hook per stack; fix `build-execution.md` recipes to chain the gate. *(silent total-disarm is the worst failure)*
- [ ] **H1/H2** Hook runs `lint:gates` + phase fidelity/e2e; register requires ≥1 pass row per touched REQ-ID/screen + spec-count reconciliation. *(closes the "green suite that proves nothing" hole)*
- [ ] **M4** Blank out `pb-g2-scope-frozen.md` to a shape-only scaffold; move the filled version to `docs/examples/`. *(trivial; prevents vacuous gate-clear + bloat anchoring)*
- [ ] **M5** Ship `pnpm-lock.yaml`(.template) + record node/pnpm toolchain. *(trivial; makes "verified green" reproducible)*
- [ ] **M6** Document Phase-Acceptance verifier as multi-agent-only + a single-context degraded mode. *(closes the independence-claim contradiction on the flagship gate)*
- [ ] **M2** Add `N/A by decision` toggles to DoR prototype/design/fidelity lines, gated on project-type. *(unblocks every non-UI project)*
- [ ] **M3** Lite banner + defer-to-WORKFLOW rewrite in `ba-core-doc-bundle.md` + solo-dev flow. *(kills the bloat-reproduction contradiction)*
- [ ] **L9** Add "Stack Independence" section + portability matrix; state plainly the acceptance floor is TS-bound today. *(honesty; prevents sunk-cost off-stack)*

### LATER
- [ ] **H4** Convert `/gate-check` clearing conditions to authoritative script exit codes (health/login/migration/route-registry).
- [ ] **H5** Split each stack-coupled leg into INVARIANT (gated) + per-stack RECIPE; ship ≥1 non-TS recipe card.
- [ ] **M1** Ship a real Leg-9 route-crawler + U13 dead-affordance lint + a "resolving ≠ correct destination" assertion.
- [ ] **M7** Second reference scaffold or standalone stack-neutral P0 scaffold-contract; soften LAST-RESORT rhetoric.
- [ ] **L2** Implement `resolve-plan-anchors` as a fail-closed pre-implementer script; add the promised dor-build/code-review lines.
- [ ] **L3** Gate Leg-8/Leg-7 behind a declared "record-grid at scale" flag.
- [ ] **L5** Explicit default-lane statement; reshape STAGE.md so Lite is the primary table.
- [ ] **L6** Project-type/gate-profile selector + ≥1 non-web profile, or scope the guide to web/CRUD.
- [ ] **L4/L1** Lane-aware RTM presence check; pair floorplan gate with a DOM fidelity assertion.
- [ ] **L7/L8** `delivery-mode` profile for DoD manual; propose per-phase floorplan deferral to the operator.
- [ ] **L10/L11** `RUN-BY-HAND.md`; agent-neutral installer preflight + next-steps.

---

## 5. Residual / Unresolved Questions

1. **Do the elearning `check-*.mjs` scripts actually exist anywhere** (in the elearning repo, uncommitted, or a private branch) to *harvest* into the template — or must they be authored from the gate-doc specs? C1's effort estimate hinges on this.
2. **Is the harness intended to be stack-agnostic at all, or web/CRUD-only?** The docs equivocate (Independence Principle is ck-skill-scoped; ADR carve-out permits other stacks; but only a TS template + TS-coupled legs ship). A single explicit scope decision would collapse ~8 of the stack-lock/overfit findings into "out of scope, documented."
3. **What is the intended enforcement altitude** — is `/build-phase` meant to be *mandatory* (then it must be mechanically forced) or an *optional accelerator* (then "auto-block" labeling must go)? The harness currently claims the former while implementing the latter.
4. **Does the target team run exclusively on Claude Code multi-agent?** If yes, M6/L10/L11 downgrade to doc-polish; if a bare-agent/Cursor path is truly required, the flagship acceptance floor needs a documented degraded mode before transfer.
5. **Is `validate:quick`** an intended-but-unshipped script (a real gap to fill) or stale prose to delete? It is cited as the commit-time fidelity executor yet defined nowhere.