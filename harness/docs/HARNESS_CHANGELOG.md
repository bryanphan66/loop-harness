# Harness Changelog

Version log of the harness operating model itself (docs, playbooks, gates,
templates). Per-project state never lives here. Current version: **v7.3**.

## v7.3 — 2026-08-17 — measurable growth (`run-log.mjs`), enforced state edges, and industry vocabulary

Triggered by a review of the 2026 agent-architecture vocabulary (harness / loop / graph engineering) against this repo. Finding: the **architecture needed no refactor** — the industry independently converged on what this harness already does (supervisor + strict phase-gating over swarms; evidence-based stopping over confidence). What was genuinely missing was **measurement**, an **enforced** state machine, and a **translation** from our invented names to the ones the rest of the world uses.

- **New `scripts/run-log.mjs` — the harness finally has a scale.** One JSONL line per dispatch (`start` / `end`), written **outside git** (`$LOOP_HARNESS_RUNLOG`, default `~/.claude/loop-harness/run-log.jsonl`) and shared across repos, keyed by the harness version it **auto-reads** from this file. `report --by harness|repo|model` turns "did v7.3 help?" into a table (completion %, blocked %, median minutes, QC failures, retries, tokens). **Closes the open end of the Growth Rule:** v7.0…v7.2 each had a sound rationale and *zero* evidence, which is why the doc tree could only ever grow — with no way to prove a rule is dead weight, nobody retires one. Refuses to invent fields (a lying scale beats no scale is false) and warns explicitly below ~5 runs or with a single group. Industry names: **evals** + **observability**; this is step 1, not the finished article.
- **`issue-state.mjs` enforces the 10-state edges (fail-closed).** The state model existed only in prose, so `Backlog → Done` — shipping without ever passing QC — was silently possible. The edge table now lives in the script and blocks anything off it; an unrecognised state name is refused too, so an org renaming its options cannot quietly disarm the guard. Backward edges encode the golden rule (fail inside AC → `In Dev`); **`Done` is terminal** (a defect found after Done is always a new issue). Human escape `--force "<reason>"` requires a reason and logs it, matching the verify-gate bypass policy — agents must fix the sequence instead. Verifiable offline: `--self-test` (20 transition cases + table integrity, exits non-zero on mismatch). This is **graph engineering at the only dose that is earned** — the one path stable enough across projects to formalize.
- **`OPERATING-MODES.md`: the 4 layers are nested, not a ladder.** `prompt → context → harness → loop` was drawn as rungs to climb, which pushes the wrong reflex: when the loop misbehaves, add another loop. The industry framing is **each layer wraps the one before it** — so the fix is usually one layer *in* (stale state, ambiguous tool contract, missing permission), exactly what the L15 permission-mode incident was. Replaced the ladder with the nesting diagram plus a **symptom → owning layer** table. Also states plainly **why there is no graph layer** (deliberate: do not diagram a workflow you still change weekly).
- **`KEYWORD-MAP.md` § H — house names ⟷ industry names.** No renames (that would churn every doc); a translation column instead: Mode A ⟷ **Spec-Driven Development**, Mode B ⟷ **event-driven loop**, verify-gate + verify-at-source ⟷ **verification loop**, Growth Rule ⟷ **hill-climbing loop**, ctl→N bg ⟷ **supervisor pattern**, D1–D6 ⟷ **constitution**, stack/steady-state kits ⟷ **harness template**. Plus the five industry terms we do *not* have (evals · observability · least-privilege · durable execution · memory engineering) — which is the backlog, stated as vocabulary. Flags **`build-side agent` vs `product-side agent`** as a distinction to keep separate from day one, and records that **"vibecode"** is industry shorthand for the sloppy practice SDD exists to correct — fine in-house, wrong in front of a technical client.
- **Repo name reviewed and kept.** `loop-harness` is already the two fastest-converging terms of the 2026 vocabulary joined in the right order (`harness` wrapped by `loop`); renaming again two weeks after `videcode-harness → loop-harness` would cost every seeded repo a drift for zero gain.
- **Not done, on purpose:** bg-worker least-privilege (still `bypassPermissions`; needs a real allow-list pass) and the landing-page lane (a new Lane, opened only after the current dogfood cycle closes — harness patches do not land mid-cycle).

## v7.2 — 2026-08-14 — ctl-ops friction fixed at the root: `wait-workers.sh` + flow publish-mode + 4 operating rules

Retro of the 2026-08-13/14 elearning dogfood (Phase-1 prod cut + a long QC loop) surfaced recurring ctl-session friction. Fixed at the root (per owner: "fix triệt để, không chắp vá"), not patched over.

- **New harness helper `scripts/wait-workers.sh`**: blocks until dispatched bg-worker(s) hit a DONE signal — a `--branch`'s PR is **MERGEABLE** (the real signal: a bg session often lingers `state=working` AFTER its PR is complete) or a `--id` worker is terminal. Run via `run_in_background`. Replaces the poll loop a ctl session was re-hand-rolling every dispatch (~15×/session).
- **`flow` (Trung's personal convenience CLI, goclaw) gained publish-mode** — additive, opt-in per-repo git config, tag-mode (hasi) unchanged. Draft-release repos (elearning: merge→main auto-drafts a version, publishing it deploys; health emits `commitSha` not `version`) now cut prod with `flow release`: merge→wait CI+draft→publish→monitor deploy→verify-at-source by commitSha→**auto-retry once on ghcr/CI flake**, fail-closed. Was hand-rolled + no retry (the v1.7.0 prod deploy failed once on a ghcr.io login timeout). Config: `flow.releasemode publish · flow.healthfield commitSha · flow.deployworkflow`. goclaw PR#2. (Not harness canon — v7.0 demoted flow to personal convenience; recorded here for the ctl-ops rules below.)
- **4 ctl-ops rules** (memory `ctl-ops-flow-publish-and-waitworkers`): (1) clean after merge with `flow gc`/`flow clean`, never manual `git worktree remove` (`gh pr merge --delete-branch` always fails on a checked-out branch); (2) never suppress `git commit`/`push` output with `-q`/`tail` — a silent pre-commit crash (`ENOENT` in a fresh worktree) pushed an EMPTY branch undetected — verify the new SHA ≠ base before push; (3) `claude rm` takes ONE id (extra args ignored); (4) fresh worktrees off origin/dev miss dirs/deps → gate false-fails; `--no-verify` is fine for a docs-only commit.

## v7.1 — 2026-08-06 — Module = repo label (not org field), Phase stays Milestone; issue-field hygiene

Fixed a real cross-repo defect: **Module was an org-level GitHub Issue Field** — one shared option list for EVERY repo in the org, wrong because module taxonomy is per-project. Moved Module to a **repo-level label `Module: <Name>`** (readable, e.g. `Module: Course Management`); each repo defines its own set. **Phase stays a Milestone** (`Phase 1/2/3`) — briefly trialled as a `Phase: N` label then reverted (milestones are already per-repo, and removing them lost nothing but risked churn).

- **`github-issue-standard.md` §3.1 + `feature-issue-ac-demo-standard.md`**: Module = label `Module: <Name>`; Phase = Milestone; allowed labels = `plane` + `Module: <Name>` (Type = Issue Type field, not a label). Supersedes the v6.22 "module in the body" rule.
- **`issue-state.mjs`**: no longer re-sends Module (drops the retired org-field value on next state change).
- **Per-project value list** lives in the repo's `runbook`/`CLAUDE.md` (Org/repo, Module label set, Phase milestones, org fields = States/Priority only, staging URL).
- **elearning adoption**: 13 `Module:` labels applied to 107 issues; org Module field **deleted** (needs `admin:org`); redundant `bug`/`enhancement`/`feature` labels removed (Type lives in the Issue Type field), `github`+`plane` kept; `feature-issues-sync.mjs` now maps its 23 register sections onto the 13 canonical module names and attaches the label (was writing `**Module:**` to the body).
- **Known follow-ups**: module is section-level in the register (coarse — e.g. login/RBAC under an infra section land on `Platform & Integrations`); GitHub→Plane cron backfill was retired (kept as a future rebuild, not running).

## v7.0 — 2026-07-29 — re-centered on the LOOP (Loop Engineering): a lean linear build feeds a self-correcting steady-state loop

Reframed the harness identity: it is a **loop-engineering system with a lean linear build on-ramp**, not a document-heavy staged process. Evidence from our own trials — auto-script stuck in the linear front underdelivered; elearning reached the steady-state loop (per-AC + human checklist, repeating) and came out solid — so the loop, not the paperwork, is where quality converges.

- **New spine `OPERATING-MODES.md`**: Mode A (Build, `/stage-next`) vs Mode B (Steady-state = the loop, issue-pipeline); graduation at go-live; the 6 loop primitives (discover/dispatch/verify/recover/persist/decide); recover + autonomy frontiers; framed with the context/harness/loop layers. README re-anchored loop-first.
- **Mode-B kit packaged** at `templates/steady-state/` (generalized `issue-state.mjs` + `qc-checklist.mjs`, bug-report + regression templates) + `playbooks/steady-state-issue-pipeline.md` — a fresh project gets the loop out of the box.
- **Macro-1 slimmed to Lite-by-default** — Full lane only for large paid clients; slim principles cap the REQ-ID / scenario / prototype-round explosion (freeze gates + REQ-ID grammar stay non-negotiable).
- **Scope-hygiene**: flow/ctl demoted to personal convenience (not harness canon; ship-standard = per-repo `release.sh` + CI/CD; control role loads from the repo's own `CLAUDE.md`).

## v6.22 — 2026-07-23 — GitHub label discipline: a fixed 5-label set, module in the body not the label

> **SUPERSEDED 2026-07-24:** the "fixed 5-label set" below is no longer current. GitHub labels are now **`github` + `plane` ONLY**; Feature/Bug/Enhancement moved to the **Issue Type** field, Phase to **Milestone**, Module stays in the body. Current rule: `playbooks/github-issue-standard.md` + `feature-issue-ac-demo-standard.md`. (Plane keeps Feature/Bug/Enhancement labels — it has no native Issue Type — an intentional GitHub↔Plane asymmetry.)

Standing up elearning's tracker had auto-created a `module:*` label per domain (12 of
them) plus `test`/`plane`/`phase-1.5` — ~18 labels the client and team had to scroll
past, drifting from the register. Corrected to a **repo-wide fixed 5-set**: `feature`
(default on every F-NNN), `bug`, `enhancement`, `plane` (mirror to PM-tool UAT), and
`phase-N` / `phase-1.5` (out of current UAT scope). Module now lives only in the issue
**body** (`**Module:** {module}`), never as a label.

- **Extends `playbooks/feature-issue-ac-demo-standard.md` §2** with the 5-label table +
  the safe reconcile order: add `feature` to every `module:*` issue FIRST, THEN delete
  the `module:*` labels (deletion cascades off all issues) so no feature ends up
  label-less; test-artifact issues get closed, not label-parked.

## v6.21 — 2026-07-22 — the delivery-and-deploy stratum: lessons from taking elearning through client UAT + Kamal staging (issue/AC/demo chain, two-env deploy, shared-branch safety)

A working session that carried elearning from red-team fixes to a client-facing UAT
package deployed on a real Kamal staging box surfaced eight generalizable lessons the
build-centric harness had not codified. Two are NET-NEW playbooks; six extend existing
docs. No gate math changes — these are operating-model + deploy + delivery knowledge.

- **NEW `playbooks/feature-issue-ac-demo-standard.md`** — the full Feature -> Issue ->
  AC -> Demo-media chain: feature-register as SoT (durable F-NNN), idempotent
  GitHub-issue sync (hidden `<!-- feat-id -->` marker, non-clobber body template),
  F-only 1:1 client UAT board (tickable AC task-list, PM-tool API caveats), and the
  load-bearing rule: **one Playwright spec per AC is the single source for BOTH the
  demo video AND the guide screenshot** (video record -> ffmpeg one frame -> webp; one
  run refreshes both; text-only edits never touch Playwright). Extends `TRACE_SPEC.md`.
- **NEW `playbooks/user-guide-hdsd-standard.md`** — the in-app user guide (HDSD) must
  be **route-based `/huong-dan/[slug]` SSG** (registry + [slug] page + sidebar/pager),
  one route per section, not a single page split by `#anchors`; visible labels never
  carry internal codes (AC/REQ-ID). Mirrors the hasi reference implementation.
- **`go-live-deploy-verify.md`** += two-environment model (DEV Dokploy/compose vs
  STAGING Kamal/CI), `redeploy != deploy` (restart vs rebuild-from-git),
  mechanism-specific verify-at-source (Kamal container name carries the git SHA;
  `commitSha` health field often useless -> verify behaviorally 404->200), DNS has no
  wildcard.
- **`AGENTS.md`** += shared-branch safety (never push a shared branch directly; PR-in
  only; force-push is a human decision; prepare-branch-hold-push for client deploys) +
  background-session hygiene (isolation hazard -> reconcile to one verified-green
  branch; base worktrees off `origin/<branch>`; a committing bg task needs full env,
  and the gate runs full validate+build at BOTH pre-commit and pre-push).
- **`solo-dev-client-delivery.md`** += confirm the client artifact TYPE before building
  (XLSX vs PM page vs issues); AC source is the per-AC HDSD blocks; plan client auth on
  staging (OTP -> internal mail catcher; use social login / auth-gated webmail / operator OTP).
- **`build-execution.md`** += public hot pages = ISR + on-demand revalidate, not
  `force-dynamic` (cold-start tax); diagnose "slow" by isolating API vs SSR TTFB and
  cold-vs-warm hits before blaming a suspect.
- **`config-driven-identity.md`** += secrets flow (non-secret in `env.clear`, secret
  name in `env.secret` + CI-materialized `.kamal/secrets`); verify OAuth landed by the
  `/auth/google` 302 target, not a button-present check.

## v6.20 — 2026-07-18 — the backend/security stratum: a second retrospective (hasi-hub, 166 reports) folds the security · concurrency · resilience · prod-packaging layer the UI-heavy elearning run never modelled

A second multi-agent retrospective ran the same mine→cluster→design→adversarial-verify
pass over **hasi-hub** — a payments + multi-tenant + auth + cron + multi-pod backend, a
very different app than elearning. It mined **~149 defect instances across 23 classes**,
deduped against v6.19, and confirmed **14 NET-NEW machine-checkable gates**. This is a
LARGE net-new layer, not a "v6.19 already covers it" result — and honestly so: elearning
(v6.19's source) is content/UI/media-heavy, so its gates never had to model the
security/concurrency/resilience/prod-packaging stratum a backend-mature app lives in.
Importantly, **6 classes / ~39 instances hasi hit were ALREADY caught by v6.19+earlier
gates** (route/role authz→Leg-6, refactor-coverage→Leg-9/U13, i18n/enum→Leg-14/U16,
fail-open secret→v6.14/v6.17, webhook→v6.15, missing FK→Leg-7) — validating that the
elearning-derived gates generalize for the classes hasi shared.

**Thirteen new phase-acceptance legs (15–27)** — all backend/data, no visual-fidelity
block (hasi's residue is not UI): **Leg-15** domain state-field integrity (a domain
clock/cap/flag lives in its own single-meaning column; no reminder clock on `updatedAt`,
no mutated cap, no sentinel in free-text, no pre-confirm mutation); **Leg-16** object-level
authz / IDOR (ownership derived server-side, scope predicate IN the query, a per-endpoint
negative-authz test — absorbs response-projection overexposure); **Leg-17** per-route
rate-limit classification (public/paid-outbound/mutating/poll-backing each need their own
scoped throttle — the global per-IP bucket is a floor, and a per-IP cap provably doesn't
stop one authed admin firing 10k paid sends); **Leg-18** session-lifecycle & OTP-purpose
integrity (revoke ALL vectors incl. trusted-device on disable, credential-change logs out
others, claims survive rotate(), OTP keyed by purpose, cookie-Path prefixes the real
endpoint); **Leg-19** canonical validator + identity-key; **Leg-20** concurrency &
write-path atomicity (no check-then-act on a limited resource); **Leg-21** process/request
resilience; **Leg-22** multi-instance state safety (no per-pod memory for cache/lock/cron);
**Leg-23** FE↔BE contract fidelity; **Leg-24** seed reseed-idempotency; **Leg-25**
notification/template render + fan-out integrity; **Leg-26** test-integrity; **Leg-27**
prod-image packaging + runtime-capability (build + boot the PRUNED image in isolation —
every runtime require resolves, binds `0.0.0.0`, every runbook command exists — catches
the `Cannot find module` / localhost-bind crash-loop BEFORE the box does, not reactively
at go-live). Plus a **build-execution Phase Pre-flight** rule: before writing a phase's
code, resolve every cited symbol/path/import/id-type against HEAD — a phantom guard, an
`npm i` of a guessed dep, an edit on a nonexistent path, or a `string` id against a numeric
`ParseIntPipe` PK is a FAIL, not an improvise-it invitation. The pre-demo self-QA checklist
gains group **H** (security & backend integrity, H1–H8) + item C5 (Leg-15).

## v6.19 — 2026-07-18 — retrospective enrichment: 182 human-caught elearning defects → 13 machine-gates + a pre-demo self-QA checklist (converting eyeball-QA into agent self-check)

Elearning reached ~7.5/10 but only after a HUMAN caught a long tail of "small"
defects screenshot-by-screenshot — the harness had folded the big structural
lessons (v6.13–v6.18) but the recurring trivial classes leaked, so the next run
would still need the same heavy human-QA. A multi-agent retrospective pass mined
**182 defects** from **83 build/fix/QA reports**, clustered them into **23 classes**,
found **9 already folded** and **14 gaps** (recurring + machine-checkable + not
gated), and adversarially confirmed **13** to fold. Result: 22/23 classes now have a
machine tooth; the 1 remaining machine-checkable class (toast) is folded too (U19);
2 non-lintable visual classes stay in the human glance + Regression Ledger.

**Six new phase-acceptance legs (9–14)** + a Leg-5 clause: **Leg-9 route
reachability** (no orphan route, no dead internal link — a link crawl asserts every
`<Link>`/CTA/share/deep-link resolves and every built route is reachable; caught
`'Đăng ký học'→404`, orphan `/reports/*`, slug deep-link with no index route);
**Leg-10 seed coherence + prototype fidelity** (cross-entity invariants = 0, seed
UPSERTS singletons over dirty rows, public catalog + default copy count-/byte-exact
to the frozen prototype — caught 37-enrolled-all-pending, 23-demo-vs-7-frozen
courses, a stale `Nháp` about-page); **Leg-11 build & migration hygiene** (`next
build` exits 0, `prisma migrate status` clean at the target, `jobId` slug-safe,
worktree base correct — extends the v6.17 AppModule boot-smoke past DI); **Leg-12
create/edit DTO round-trip** (every form submits 2xx and persists — no
guaranteed-422 and no silent no-op; submit disabled until DTO-required fields set);
**Leg-13 record-lifecycle** (reuse-or-create not mint-on-remount, real TTL→terminal,
no phantom rows on partial fan-out); **Leg-14 i18n catalog + export** (ICU-compile,
0 dead keys, no vi=en, localized downloads); and **Leg-5 clause U-img** (public
image integrity in a real browser — decode not broken, no upscale, no hotlink,
onError fallback, cache-bust, persistent-fs — the checks a curl 200 hides).

**Seven new visual-fidelity auto-blocks (U13–U19):** U13 dead-affordance
(styled-clickable with no handler), U14 inline-grid-reflow (inline gridTemplate
beats @media → mobile scroll), U15 icon-registry-coverage (silent no-render / one
icon for all types), U16 enum-status-exhaustive (list↔detail single-source, no
catch-all `else`), U17 prototype-copy-verbatim (separator glyph byte-fidelity — 207
drifts), U18 shared-primitive-clobber (CSS-shorthand reset / hardcoded layout width /
wrong slot), U19 toast-convention (`duration:Infinity`, raw server message, bespoke
banner). NOTE (corrected 2026-07-20): the U13–U19 dead-affordance / inline-grid-reflow /
icon-registry-coverage / prototype-copy-verbatim / primitive-inline-style /
toast-convention checks are **SPECIFIED but NOT YET SHIPPED as `lint:gates` scripts** —
they are enforced manually via `pre-demo-self-qa-checklist.md`. The scripts actually
shipped in `lint:gates` are **three**: `check-universal-fidelity-imports.mjs`,
`check-prisma-fk-indexes.mjs`, `check-admin-screen-width-caps.mjs`. Do not rely on the
six as auto-blocks until they ship. (Was overstated as "six lint:gates scripts".)

**The keystone deliverable is `playbooks/pre-demo-self-qa-checklist.md`** — a
runnable 7-group checklist (nav/interaction, links/routing, grids/lifecycle,
config/seed, conventions/i18n, media-real, responsive) the agent drives against the
running preview BEFORE any human handoff, each item an explicit pass/fail. It is
what turns the human's screenshot-by-screenshot review into an agent self-check, so
the next run catches these classes at build time, not at the demo.

## v6.18 — 2026-07-18 — user-facing product media is REAL (device-framed screenshots), and a demo VIDEO is a product-tour, not a step-by-step tutorial (elearning UAT-media)

Two linked lessons from producing elearning's UAT hand-off media — both a variant
of the harness's core "adopt the real thing, don't re-draw" discipline, now applied
to docs + demo video, not just UI.

**(1) User-facing product imagery must be REAL screenshots in a device frame, not
hand-drawn mockups.** The first HDSD (user guide) shipped hand-drawn **schematic SVG
mockups** (grey rectangles + a green dot) inside a macOS window frame — they "looked
like the app" but weren't it, so a reader can't map the guide to what they see. Fix:
keep the device frame, replace the interior with **real captured screenshots**
(`.webp`, one per guide section, fall back to the schematic only where a shot is
missing). The user-manual deliverable's imagery is held to the same fidelity as the
UI itself — a schematic stand-in is redraw-by-omission. (Also fixed a sidebar that
scrolled its active item out of view — a nav must keep the current section visible.)

**(2) A customer demo VIDEO is a narrated product-tour, not a step-by-step
recording — pick the style FIRST.** The demo video was first built as a Playwright
`recordings` run: one flow per spec with a `narrate()` subtitle on **every
micro-step** — the **user-guide** style, which reads as a dry click tutorial, wrong
for a demo. New playbook `demo-video-production.md` names the **three** styles and
when each applies: **(1) user-guide recording** (Playwright, per-step subtitles — for
docs), **(2) product-tour video** (Remotion: the real app in a device frame + motion
+ a continuous voiceover + storyline **big→small** — for a client demo/show-off),
**(3) live demo script** (a cheat-sheet a person reads while demoing live — not a
rendered file). The tool looks similar across 1 and 2; the difference is the
**script**, so confirm the style with the owner before rendering. Verified
product-tour recipe: an **isolated Remotion project** outside the app workspace
(never enters `validate`/build), **reuse the same real screenshots** the device-frame
guide captured (no burnt-in subtitles), an **offline neural TTS** voiceover (proven:
piper `vi_VN-vais1000-medium` — no cloud key, deterministic, re-renderable), a
**timeline driven by the measured VO length** (`ffprobe` → scene durations) so
picture and narration stay in sync, rendered as **per-part MP4 + one stitched
master**, binaries gitignored + output outside the repo. Enhancement hooks (music
bed, hero clips, human-VO swap, brand-themed frame, EN variant, 3-min cut) are listed
for the next iteration.

## v6.17 — 2026-07-17 — Go-live hardening: config-driven business identity floor + deploy-verify-at-source playbook (the "Go-live" half of Macro 2, filled from elearning's hardcode sweep + prod deploys)

Macro-Stage 2 is "Build & **Go-live**", but the go-live half had no playbook — deploy
lived only in a template + the DoD prose, and "no hardcode" only covered design
tokens. Elearning's go-live surfaced a cluster of real defects that a DoD-passed
build still shipped, so v6.17 gives the go-live half two floors + two DoD legs.

**(1) Config-driven business identity** (`playbooks/config-driven-identity.md`, new;
DoD Core leg). Every piece of business identity — brand/site name, company legal
name + tax code + address + contact, support email, canonical URL, SEO provider,
copyright — must render from the settings/`site_configs` store, never a code
literal. The failure mode is that a hardcoded brand **passes the demo glance**
because the seeded config value equals the literal, then breaks the instant the
client edits Settings: the cert PDF, invoice seller block, email footer, json-ld
`provider`, and copyright still show the old identity. Offenders found: a cert
renderer with a baked navy/gold layout ignoring the admin-designed template
(`fields_config` + design asset); an invoice seller typed as a literal; six email
templates greeting with the brand literal; json-ld `provider:{name,url}` hardcoded;
copyright with a dead year. Fix pattern: a **cached, worker-reachable** config loader
(documents + emails render in the worker, not the API), fail-soft to the current
identity. Go-live **sweep** at 2.10: grep the identity literals repo-wide (incl.
`apps/worker` + PDF/email builders), every hit in a document/email/SEO/chrome
surface is a defect, then flip a staging Settings value and confirm it reflects.
Marketing social-proof numbers ("9.000+ students") are NOT hardcode — wire to a real
count or keep by recorded owner decision, never silently downgrade to the raw value.

**(2) Go-live deploy & verify-at-source** (`playbooks/go-live-deploy-verify.md`, new;
DoD Core leg). Five rules proven on the elearning prod deploys: **(a)** build-time-
inlined env (`NEXT_PUBLIC_*`, `sitemap.ts`/canonical/OG/json-ld) is a Docker **build
ARG**, never only a runtime env, and a redeploy of the SAME commit reuses the image
cache so the value won't change without a source-changing rebuild — the symptom was
prod still emitting `localhost:3000` after the domain env was "set". **(b)** Verify at
the **source** by health `.status==ok` **+ a content marker only the new build
produces** — never CI-green, HTTP-200 (can be the old container), or a version
string (`commitSha` was `local-dev` on the box); and pick the marker deliberately (a
literal that lives in seeded DATA never flips → false negative). **(c)** extends v6.14:
a compose `${MONEY_SECRET:-non-empty-placeholder}` default is WORSE than missing — it
passes the presence-only fail-closed check so prod boots GREEN on a **fake** money
config (payments to account `0000000001`, sandbox key never confirms); money/identity/
legal guards must reject KNOWN placeholders, not just empty. **(d)** a fail-closed
hardening ships to REAL prod (real creds set first), never to the shared demo box
that intentionally runs on placeholders — it'd crash-loop it; keep the hardening
branch un-deployed until the cutover. **(e)** the prod deploy is an explicit,
named-endpoint human decision an agent surfaces, never fires silently.

**(3) Runtime & fidelity legs consolidated from the P0–P16 build.** Five more
elearning-surfaced defects, each landed in the gate/playbook that owns it: **Boot
smoke** — `validate:quick` compiles + unit-tests but never boots the real AppModule,
so runtime DI/wiring + fail-closed-config errors shipped GREEN and crash-looped prod
(a fail-closed secret that threw at boot; a service with an un-`@Optional()` optional
collaborator not in its module → "Nest can't resolve dependencies"). The gate now
boots the full AppModule (`Test.createTestingModule({imports:[AppModule]})`) and any
optional-collaborator ctor param carries `@Optional()` — landed in `build-execution.md`
§ Validate Bootstrap + `phase-acceptance.md` Leg-1 security floor + a `dod-build.md`
Core leg. **Media-delivery proxy** — a playback URL handed to a browser must be an
entitlement-gated HTTP **proxy route**, never a raw storage signed-URL: a `file://`
local-driver URL (or a relative child playlist that loses its presign) spins hls.js
forever; `signManifest` returns a root-relative path so children resolve into the
same guarded route, + a client watchdog; verify by driving the STUDENT path
(OTP-login → HTTP not `file://` → `#EXTM3U` → `.ts` 200 `video/mp2t`) — landed in
`media-pipeline.md` category 3 + the `phase-acceptance.md` media leg. **Interaction-
completeness** (visual-fidelity **U11**) — a screen that renders but doesn't interact
(a tab seeded from `?tab=` into local `useState` once → sidebar deep-links changed the
URL but not the page); URL-addressable state is derived from the URL each render, and
mutations use the app's shared `toast` convention. **Screen-region completeness**
(visual-fidelity **U12**, sharpens U10) — the hero table/form is ported but secondary
regions (StatCard row, composite cards, Pagination + its `page` param, a resources
tab, per-row durations, accordion) are silently dropped though the data exists; the
gate diffs the whole region inventory. **Fetch-all pageSize cap** — a grid that
fetches-all for client-side sort/filter must size its fetch ≤ the endpoint's
`pageSize.max` (a 200-vs-max-100 request 422'd the page while a default-size `curl`
200'd) — landed in `build-execution.md` guardrails + the `phase-acceptance.md` grid
floor.

## v6.16 — 2026-07-12 — grid completeness floor: every data grid ships pagination + filter + sort (operator elevated from per-feature to universal)

Pagination was already universal (NFR.PERF.08); filter + sort were only per-feature
(leads, orders, dashboards) + the CRM grid. The operator elevated the rule: EVERY
data grid (a table of records) ships pagination + at least one filter/search +
column sort as DoD — plus export where the feature calls for it. A grid that lists
records with no way to filter/sort them is an incomplete grid, not a smaller one
(the same shape as the public catalog shipping without its filter row, U10). Added
as phase-acceptance Leg-8 (crud phases) + project NFR NFR.UXC.08. A pure 2-D config
matrix (role×area permissions) is exempt — the floor is for record lists. The
verifier now fails a new record-list screen that ships without wired
pagination/filter/sort.

## v6.15 — 2026-07-12 — a webhook is authenticated to the PROVIDER's real scheme, not a guessed HMAC

P11 built the SePay webhook verify as HMAC-SHA256 over the raw body (`x-sepay-
signature`). Correct security *shape* — verify-before-DB, constant-time — but the
WRONG scheme: SePay authenticates webhooks with a shared API key in the
`Authorization: Apikey <key>` header, no body signing. So every real SePay webhook
would have 401'd and no payment ever auto-confirmed — a silent break a mocked test
(which signed with the same HMAC) sails through. Fixed the provider to the Apikey
scheme, verified at source (no-key/wrong-key → 401, right-key → 200/handled). The
external-integration playbook's "webhook signature verify" AC becomes "webhook AUTH
verify — to the provider's ACTUAL documented scheme (HMAC sig / `Authorization:
Apikey` / basic / mTLS), confirmed against their docs AND a real sandbox callback,
not a guessed default." The scheme stays one adapter detail behind the provider port.

## v6.14 — 2026-07-12 — a new fail-closed secret must ship with its deploy-env value, or the next deploy crash-loops

P11 (SePay) correctly made its money-flow config fail-closed — the API refuses to
boot in production without SEPAY_WEBHOOK_SECRET/IPS/ACCOUNT_NUMBER/BANK_CODE (no
weak-default HMAC on a payment webhook). Right call. But the deploy compose didn't
provide those vars, so the next deploy **crash-looped the API** (box 404, health
red) while the worker stayed up. Same class already hit once with JWT-secret + prod-
seed. Security floor (Leg-6) gains the corollary: a phase that introduces a new
`NODE_ENV=production`-required env var MUST, in the same phase, either add a safe
sandbox/placeholder default to the deploy compose (`${VAR:-default}`, staging boots,
real creds override) OR list it in the report under "deploy env the control must set
before deploying". A new fail-closed secret with neither is an incomplete phase —
the fail-closed check is correct; the missing deploy-env is the defect.

## v6.13 — 2026-07-12 — a ported screen must be the WHOLE design, not a reduced gist

The public course catalog (a size-S phase) shipped a stripped port: the filter row
lost its three selects (level/price/sort — only search survived), the multi-column
`SiteFooter` collapsed to a copyright line, and the nav rendered the DARK `on-ink`
variant where the export's catalog page uses the LIGHT/white nav + a utility
top-strip. Each omission "looked close" alone, so it passed a loose glance.
**U10 (visual-fidelity auto-block 17):** adopt-export means porting the whole
screen — every toolbar/filter control present + wired (a missing select is a
dropped feature), shared chrome (top-strip, footer) at full fidelity (not a stub),
and a kit component used in the SAME variant the export picked for that screen (not
defaulted). The glance compares the ported screen to the export as a whole —
toolbar, chrome, variant — not just "the main content is there." Size-S is not
licence to ship a lossy summary.

## v6.12 — 2026-07-12 — a typed entity must render per-type, not the one variant the prototype drew

The lesson list showed video / text / pdf lessons — but the lesson EDITOR rendered
the video banner for ALL of them (a `text` "bài viết" lesson and a `pdf` lesson both
showed a video frame). Root: the SRS (`course-management.md` CM.CHAP.02) defines
three DISTINCT contents — video → R2 video asset, text → rich-text HTML body, pdf →
R2 PDF URL — but the frozen prototype only DREW the video lesson-edit screen, so the
build defaulted that one layout onto every type. **U9 (visual-fidelity auto-block
16):** an editor/viewer for a typed entity (a `type`/`kind` enum) is type-aware — it
branches on the enum and surfaces the SRS-defined content per value; where the
prototype drew only one variant, the others are designed on top of the frozen kit
(additive faithful work), never the drawn layout defaulted onto all. The verifier
checks each enum value renders its correct surface. A phase whose entity has a type
enum must be checked per value at 2.3/2.6.

## v6.11 — 2026-07-12 — a working native primitive is not the adopted design; and a transcode ladder never upscales

P7 shipped a video area that *worked* — but the operator caught it rendering a
native `<video controls>` grey bar (the frozen export shows a designed player:
poster + green center play + "HLS {res} · {dur} · CDN R2" badge) and a
`window.prompt()` for rich-text image insert (the export shows an in-app dialog +
real upload). It passed because "it works" — the exact loose-glance gap approach-B
is meant to close. Separately the HLS ladder force-upscaled a 480p source into fake
720p/1080p renditions.

- **U8 (visual-fidelity auto-block 15):** a native browser primitive substituted
  for a designed export control — native `<video controls>`, `window.prompt/
  confirm/alert`, bare `<select>` where the export shows a custom one — is
  redraw-by-omission, not adoption. Adopt the designed control (poster-then-play;
  in-app dialog, never `window.prompt`); native is allowed only where the export
  itself shows it. The interaction-side twin of the U1–U4 look assertions.
- **media-pipeline: never upscale.** The 480/720/1080 rungs are a *maximum*, not a
  fixed ladder — probe the source height and emit only rungs ≤ source (≤480 → one
  480p rung, no fake 720/1080; gate asserts the upscaled files are absent from
  storage). Badge/DB carry the actual max height.

## v6.10 — 2026-07-12 — authz isn't done at the API: the Security floor grows a UI-gating leg + an RBAC self-lockout guard

The operator opened an admin screen where the "Delete" action still showed for a
role whose Delete grant was unticked, and asked the load-bearing question: *is the
permission model actually applied to the modules, or only seeded?* Verified answer:
the API enforced it (every route guarded, delete=D, publish=W — real 403s), but
**the UI rendered every action button unconditionally** and the permission matrix
had **no self-lockout guard** — the operator had unticked the ceiling-defining ADM
role's own grant, dropped the ceiling below Delete, and locked everyone (incl.
themselves) out of ever re-granting it. Two gaps the "API is guarded" checkmark hid.

Security floor (Leg-6, v6.7) gains two clauses:
- **UI reflects authz.** A route guard is necessary, not sufficient. Every admin
  screen gates its mutating controls (delete/publish/create) on the caller's fresh
  grant — hide by default — read from the same authoritative source the guard uses
  (surface the caller's grant map on `/auth/me`), never a divergent copy. Verifier
  asserts both layers: control hidden AND API still 403s.
- **RBAC self-lockout guard.** A permission-editing matrix must refuse an edit that
  lowers the ceiling-defining role's OWN grant below its current level (client +
  save-API, defense-in-depth), with a documented recovery (idempotent boot seed
  restores spec on restart). Raising always allowed.

Same shape as the run's other lessons: a defect the human found once becomes a
per-phase floor the machine proves — here the floor is "a guarded route is only
half of authz; the screen must show the truth too."

## v6.9 — 2026-07-11 — the status surface splits in two: internal ops-board + curated client-facing roadmap

The status Artifact (v6.6) was a single surface — full engineering truth for the
team. But that surface must NEVER be handed to the client: it carries phase IDs,
SHAs, harness versions, gate names, stack nouns. The run therefore keeps **two**
hosted Artifacts, each to its own stable URL:

- **Internal ops-board** — unchanged: the team's cockpit, everything revealed.
- **Client-facing roadmap** — a *curated* buyer view (Locked Decision D4): same
  verified facts, but grouped into **value buckets** (not P-phases), stripped of
  all machine tokens, one honest %-framed-positively, SOW-date milestones, and
  only the blockers **the client must act on** phrased as a courteous "what we need
  from you" callout. It is a **PM deliverable the CS role forwards** to the client;
  in a solo run the operator wears both hats but the two files stay separate — the
  internal board is never the thing sent out.

New playbook `playbooks/status-surfaces-ops-and-client.md` owns the how (phase→
value-bucket roll-up recipe + a 5-point curation checklist that fails a surface
that leaks any internal token or inflates the number); HARNESS.md § Status Artifact
gains the two-surface table + curation rules + the PM/CS ownership handoff. Same
verify-at-source discipline (FC6) governs both — curation reframes, it never lies.

## v6.8 — 2026-07-11 — interactive-UI floors: reorder-both-directions (U5) + navigable breadcrumbs (U6) + ported-mockup width cap as a tree-wide lint (U7)

The P6 human glance surfaced a cluster of **interaction** defects that the visual
fidelity gate (which proved the *look*) did not catch — the screen matched the
export pixel-for-pixel yet was operationally broken. Three promoted to permanent
gate rules (visual-fidelity.md Auto-Block 12–13 + adoption note):

- **U5 reorder-both-directions.** The chapter/lesson editor used a hand-rolled
  HTML5 `dragstart/drop` reorder with the classic **down-direction no-op** (drop
  onto the next row landed one slot short → items moved UP but never DOWN), and
  only a 12px grip was draggable with no keyboard path (axe-failing). Rule: any
  drag-reorder MUST use a real DnD primitive with a keyboard sensor (dnd-kit), the
  **whole row** is the handle, and the gate asserts `sort_order` **persists across
  reload in BOTH directions** + keyboard reorder works. Persistence verified at
  source, never from the optimistic UI.
- **U6 navigable breadcrumbs.** The object-page breadcrumb rendered every crumb as
  inert text. Rule: non-last crumbs are keyboard-focusable links that route to the
  ancestor; only the last is plain `aria-current="page"`.
- **U7 ported-mockup width cap (root-cause fix, not a patch).** The frozen export
  screens are drawn as centered narrow columns, so each ported screen bakes its
  own `maxWidth: 720/760` that overrides the shell content column and renders the
  page not-full-width. This is not a one-off — the cap rides in with every ported
  screen, so it surfaced on the chapter editor and then AGAIN on the sibling
  lesson editor. The remedy is therefore NOT another screen-local assertion but a
  **single lint over the whole screen tree** (`check-admin-screen-width-caps.mjs`,
  wired into `lint:gates`): any LARGE inline `maxWidth`/`max-w-[…px]` (≥480px) under
  the admin route dir fails the gate; small element caps + control `minWidth`s pass;
  a truly-intended narrow column opts out with `// width-cap-ok: <reason>`. Removing
  the cap to fill the shell column is a legitimate deliberate export deviation.

Same lesson as v6.1–v6.5: a defect the human finds once becomes a machine
assertion so it never returns — here two of the three (U5/U6) were interaction, not
appearance, so the fidelity gate grew interaction teeth; and U7 adds the meta-rule
that **a defect recurring across sibling ported screens is promoted to one lint over
the entire screen directory** — catch the whole class at the source, not per-screen.

## v6.7 — 2026-07-11 — front-load the cross-cutting floors: the per-phase gate proves them, the human confirms

A 3-agent audit at P3/P4 confirmed the operator's fear structurally: the harness
was **reactive** — every cross-cutting concern (i18n, responsive, a11y, theme,
security-authz, loading/empty/error states, DB indexes) was end-loaded to the
2.7/2.9/2.10 gates or discovered by the human glance, then retrofitted (v6.1–v6.5
all landed in one day, each closing a defect a human had just found). Worse, the
"universal" U1–U4 assertions were **prose, not a mechanism** — hand-copied into
the two screens that failed, with no shared fixture and no injection into the 2.3
compile, so a new screen got them only if its author remembered. That does not
reach P25: the human becomes the discovery bottleneck.

Fix — `phase-acceptance.md` Leg-1 verifier gains **three always-run legs** so the
MACHINE proves the whole cross-cutting class *in every phase* and the human glance
drops back to confirming aesthetics: **Leg 5 Universal UI floor** (a shared
`_universal.fidelity.ts` fixture — app-shell/focus/both-themes/shell-scroll/i18n/
responsive/states + axe-core a11y — that every `*-fidelity.spec.ts` must import,
enforced by a RED lint gate, so screens inherit it by construction); **Leg 6
Security floor** (default-deny global authz — no route metadata ⇒ 403; unauth→401
/ under-priv→403 asserted per new route; secrets fail-closed at boot); **Leg 7
Index discipline** (`crud` phases index every FK + filter/sort column, schema-lint
enforced). First realized as the elearning **P3.5 Foundation Hardening** phase
(before P4) so the remaining 22 phases inherit a clean floor instead of accreting
debt against it. The Regression Ledger (v6.5) stays the reactive backstop for
genuinely novel one-offs; this change removes the whole-*class* leakage it was
being asked to carry.

## v6.6 — 2026-07-11 — the Status Artifact: a live human tracking surface

Reports are the machine's per-phase memory (dense, read on demand); the operator
needs the opposite — one glanceable, always-current page so tracking never means
scrolling the transcript. Formalized in `HARNESS.md` § Status Artifact: stand up
a self-contained hosted dashboard early (once the dev preview is live), refresh it
at every milestone (re-publish the same file → stable URL → the bookmark never
breaks), and show live service checks + delivered capabilities with state chips +
the run's harness lessons + run parameters — summary before detail, state encoded
as dots/chips. It mirrors verified truth (FC6: a capability reads "live" only when
its live check passes), never narrates ahead. The status Artifact is the
operator's cockpit; the reports are the flight recorder — both kept, different
readers. (First instance: the elearning "Build Mission Control" dashboard.)

## v6.5 — 2026-07-11 — the Regression Ledger: a noted-and-fixed UI defect never comes back

Operator directive after a run of "small" mobile bugs (clipped modal, sub-44px
tap target, modal-won't-dismiss): once a defect is noted, the related parts must
NEVER be wrong again as the harness runs on. Formalized in `visual-fidelity.md`
§ Regression Ledger: **noted-and-fixed ⇒ locked-by-assertion** — every fixed UI
defect, however small, becomes a permanent machine assertion on the touched
screen's spec that runs on every later phase; a fix without a regression
assertion is incomplete and blocks the phase. Recurring/cross-cutting classes get
promoted to universal always-on assertions (this is literally how U2/U3/U4 were
born). The point: machine memory, not human memory, keeps small bugs from
returning across the run.

## v6.4 — 2026-07-11 — UI phases carry the mandated cross-cutting NFRs (i18n + responsive), not just the look

A frozen Claude-Design prototype captures the DESKTOP look in a SINGLE language.
But the SRS mandates more: `NFR.I18N.01` (locale floor VI+EN, locale-aware
number/currency/date — "5,000,000 VNĐ") and `NFR.UX.01` (student-facing usable at
≥375px, no horizontal page scroll, tap targets ≥44×44px), `NFR.UXC.08`/`PORT.01`
(responsive), `NFR.A11Y.01` (WCAG 2.2 AA). The elearning run shipped screens that
matched the prototype pixel-for-pixel yet had a dead VI/EN toggle and no responsive
behaviour — faithful to the look, silent on the NFR floor. Fix — gate Auto-Block
rule 11: every UI phase ships the SRS-mandated i18n + responsive as DoD, proven by
machine assertions (locale switch changes the visible strings + currency/date
render per locale, no target-locale string hardcoded; at the mandated min viewport
no horizontal scroll + tap-size floor). These are *additive faithful work* — the
second locale and the reflow are designed on top of the frozen visual language
(the prototype has no responsive/i18n spec, so the reflow is free-design within
the same tokens/components), not a redraw. The prototype covers look; the NFRs are
a separate, mandatory floor.

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
