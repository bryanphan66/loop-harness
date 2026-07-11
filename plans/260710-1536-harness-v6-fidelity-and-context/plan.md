# Harness v6 — Toothy Fidelity Gate + On-Disk Context Handoff

**Date:** 2026-07-10 · **Scope:** `harness/` (design) then apply to `elearning-platform` (redo UI). · **Trigger:** live run on elearning surfaced a CLASS of gaps, culminating in P1/P2/P3 UI diverging hard from the frozen Claude-Design prototype (dark theme instead of light, logo dropped, "Đăng ký học" link + VI/EN toggle dropped, washed-out button) while the automated verifier stamped it PASS.

**Design principle (chosen):** the durable source of truth is the DISK spine, not a session's memory. Make the on-disk contract strong enough that any fresh per-phase session builds faithfully + consistently, and give the fidelity gate real eyes. Session-longevity is a tuning knob, not the load-bearing fix.

## Failure-class taxonomy (fix the CLASS, not the instance)
- **FC1 — Delivery gap:** a harness artifact never reaches its point of use → the agent improvises. (Stack template not shipped into the project → tier-2 hand-built; fixed ad-hoc in v5.2.)
- **FC2 — Fidelity gap:** "port from export" is interpreted loosely → an LLM porting JSX-by-text reproduces the functional skeleton and silently DROPS visual elements + gets theme wrong.
- **FC3 — Toothless verification:** the gate is the builder's own unverified claim ("matches export") — no render, no screenshot-diff, no human eyes → divergence passes.
- **FC4 — Context/intent handoff:** each phase = fresh session re-deriving intent from files; the orchestrator's + user's accumulated steering never binds the child → drift + cross-phase inconsistency.
- **FC5 — Build-once infra artifacts missing:** env/deploy config the app needs (NEXT_PUBLIC_API_URL build-arg, dokploy-network overlay) improvised per project instead of shipped/generated.

## Systemic fixes (v6)

### 1. Locked shared UI kit (kills FC2 theme/component drift at the root)
- Port the prototype's ACTUAL kit ONCE, faithfully: `kit.jsx` components + `tokens.css` + `components.css` → the app's real design system (Tier-2 tokens + a component library: Button/Input/Logo/AuthShell/OtpInput/Badge/etc. matching the prototype 1:1, including the real Logo image + light-first theme).
- Lock it (version-pinned). Every screen phase MUST import from it; re-inventing a component is a build-phase BLOCK. → theme + components consistent by construction, not by session memory.
- Harness change: `docs/playbooks/design-system-3-tier.md` + build-execution gain a "port the kit first, lock it, reuse-only" rule; walking-skeleton (2.4/2.5) or a dedicated "P0.5 design-system" phase builds+locks the kit before any screen phase.

### 2. Per-screen fidelity contract (kills FC2 dropped-elements)
- For each screen: export ref + a **Required-Elements Checklist** (every visible element the prototype has: logo, each field, each button + its variant, links like "Đăng ký học", language toggle, empty/error/loading states) + the token/theme it must use.
- Compiled at 2.3 into the manifest phase block; the build-phase agent must satisfy every checklist item — a missing element is a defect, not a stylistic choice. Screen-inventory rows gain the checklist.

### 3. Toothy visual gate (kills FC3)
- New/upgraded `docs/gates/visual-fidelity.md`: a phase with screens is NOT done until an actual screenshot of the running built screen is placed **side-by-side** with the prototype render, and (a) an agent verifier checks the required-elements checklist against the screenshot, then (b) the human operator approves the pair BEFORE the phase closes (not after). Divergence = BLOCK.
- Mechanics: add a screenshot step to the pipeline (headless browser capture of the running preview; the prototype render is captured from the Claude-Design board or the export). Wire into `/build-phase` step 5 as a hard leg. Human-approval-before-done becomes the default cadence for UI phases.

### 4. On-disk context handoff (addresses FC4 without a persistent session)
- **Intent digest**: the orchestrator maintains a curated `docs/build/intent-digest.md` (design decisions, user steering nuances, "port faithfully incl. decorative elements" rules) that is injected verbatim into EVERY build-phase packet — so a fresh session inherits intent from disk.
- **Decisions log**: each phase appends what it decided/built (components created, patterns) so later phases read + reuse, not re-invent.
- Session model: per-phase isolation stays default (context-eng sound, no overflow); a **per-module persistent session** is an allowed knob for cohesion within one domain cluster; one-session-for-all is banned (context overflow → mid-build compaction loss).

### 5. Build-once infra artifacts (kills FC5)
- The stack template ships the deploy-critical bits already correct: web Dockerfile `ARG NEXT_PUBLIC_API_URL`, a `docker-compose.dokploy.yml` overlay pattern (or a generator), so projects wire config, not architecture. Fold v5.2 + today's Dockerfile/dokploy fixes back into `templates/stack-pnpm-nest-next/`.

## Apply to elearning (after v6 lands)
- Build+lock the faithful UI kit from the prototype; redo P1/P2/P3 screens against the fidelity contracts; screenshot-vs-prototype + operator approve each; redeploy. Logic already verified — only the UI layer is redone.

## Success criteria
- A screen phase cannot close while its screenshot visibly diverges from the prototype (missing element / wrong theme) — caught by the gate + human, not discovered later.
- Any fresh per-phase session builds theme-consistent, component-consistent UI because the kit is locked + imported, and intent is injected from disk.
- The stack template deploys with correct env/network out of the box.

## Red-team refinement (LOCKED design)
Self-red-team found the draft's teeth were weak. Corrections:
- **The gate's real teeth = machine-checkable assertions + a kit verified ONCE, NOT LLM image-compare** (an LLM comparing two screenshots is unreliable + biased toward "same"). Encode each screen's Required-Elements Checklist as **Playwright assertions** on the running app (logo `<img>` present, "Đăng ký học" link present, VI/EN toggle present, submit uses the primary token, page bg is light) — a dropped element = a RED test, undeniable. Prose ("port from export") gets skimmed; an executable assertion cannot.
- **The kit is the leverage point and carries the same port-lossiness risk as screens** → it gets a dedicated **"P0.5 lock design-system" phase**: port kit+tokens+components faithfully, verify, **operator sign-off ONCE** (hardest scrutiny, one time). Every screen then inherits correct theme+components → per-screen human review becomes a quick glance, which SCALES to ~101 screens.
- **Human review = quick glance enabled by surfaced side-by-side** (deployed screen vs the prototype image the operator already has). The kit-verified-once + assertions do the heavy lifting; the human judges only aesthetics.
- **Intent-digest stays LIGHT** (soft intent only); hard guarantees live in the locked kit + assertions, so a skimmed digest can't cause a fidelity miss.

### Two load-bearing mechanisms (YAGNI core — would have caught today's failure)
1. **Locked kit verified once** — fixes theme + component drift for ALL screens (catches the dark-bg).
2. **Per-screen Playwright element assertions** — catch dropped logo/link/toggle mechanically, scalable, undeniable.
The rest (kit sign-off ritual, human glance, digest, build-once infra) are the bolstering layer.

### Added failure-classes (from this session)
- **FC6 — Control-layer trusting wrapper signals:** the orchestrator reported "push exit 0" off a `| tail` pipeline while `git push` actually returned 1 (rejected). Rule: **verify at the real source** (read the tool's own output/state), never a wrapper exit.
- **FC7 — Human rubber-stamp:** approving a gate without truly looking. The gate MUST surface the side-by-side artifact so review isn't blind.

## Answered open questions
- Screenshot tooling: **Playwright (already in the stack)** for both the element assertions and screen capture; compare against the prototype images the operator already has — no bespoke auto pixel-diff.
- **Yes** — dedicated "P0.5 lock design-system" phase (verify+sign-off the kit once).
- Intent-digest: keep it **light**; assertions + locked kit carry the guarantees.

## Implementation order (approved)
1. **Proof first (in progress):** port the prototype kit faithfully into elearning (light theme + real Logo + solid-green Button + AuthShell + LangToggle) + redo login/otp screens with ALL elements + Playwright fidelity assertions → redeploy → operator sign-off vs prototype.
2. Scale the same to remaining P1/P2/P3 screens.
3. Fold the mechanisms into the harness: P0.5 phase, fidelity-contract-as-assertions in build-manifest + build-phase, toothy visual-fidelity gate (assertions + surfaced side-by-side + human-before-done), FC6/FC7 control rules, build-once infra in the stack template.
