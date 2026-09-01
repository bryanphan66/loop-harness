# Harness

The **loop-harness** (khung vận hành cho AI agent) is a reusable operating model
(mô hình vận hành tái dùng) that lets a solo dev (with
agents) turn a raw client lead into safe, validated, accepted, maintained
software across **3 macro-stages** (3 macro-giai đoạn) — Pre-Build, Build &
Go-live (thời điểm app lên môi trường thật), Post-Build.

The app is what the client touches. The harness is what agents touch.

## Three-Layer Architecture

The harness is the **control plane** (mặt phẳng điều khiển — quyết việc gì chạy
kế) that drives an **engine** (cỗ máy sinh sản phẩm) of artifact (sản phẩm/tạo
tác) producers, executed by **role players** (người đóng vai các vai trò SDLC).

| Layer | Role | Components |
|---|---|---|
| **Control plane** | decides *what runs next* + *did the gate (chốt kiểm) pass* | `STAGE.md`, the canonical gates (`docs/process/WORKFLOW.md`), the verify-gate (cổng kiểm chứng không bỏ qua được) hook (`scripts/harness-verify-gate.sh`), stage-boundary commits, the `stage-runner` orchestrator (bộ điều phối) + `/stage-next` |
| **Engine** | *produces* the artifact each step | the `ck-*` skills (live, **invoked** — never vendored / không sao-chép nhúng) + `cook` / `ship` / `deploy` / `devops` |
| **Role players** | *execute* each SDLC (vòng đời phát triển phần mềm) role's work | the global agents (planner, researcher, fullstack-developer, code-reviewer, tester, debugger, ui-ux-designer, docs-manager, project-manager, git-manager, code-simplifier, journal-writer, brainstormer), orchestrated by `stage-runner` |

The control plane is portable and self-contained (tự-đủ — không phụ thuộc ra
ngoài chính nó). The engine and role players are
**accelerators** (bộ tăng tốc, không bắt buộc): a bare agent reading the
playbooks (công thức tái dùng) can play every role and
produce every artifact without any `ck-*` skill.

Full role → engine binding: `docs/about/ROLE_MAP.md`. Step-by-step map:
`docs/process/WORKFLOW.md`.

## Independence Principle

The harness must function with only:

- An agent that can read/write files and run shell commands (Claude Code,
  Cursor, Continue, or a human reading the docs).
- Git and bash (for `scripts/install-harness.sh`).

The `ck-*` skills are the **live engine** the harness invokes — but they are
**accelerators, not dependencies**. The harness must still be runnable on a bare
agent + git + bash.

Specifically:

- `AGENTS.md`, `STAGE.md`, `docs/process/WORKFLOW.md`, `docs/about/HARNESS.md`,
  `docs/about/TRACE_SPEC.md`, and `scripts/install-harness.sh` MUST NOT reference any
  `ck-*` skill as a **required** step.
- `install-harness.sh` **preflight-checks** (kiểm tra điều kiện trước khi chạy)
  that `~/.claude/skills` and
  `~/.claude/agents` exist and **WARNS if missing** — it never copies them into
  the project repo.
- Playbooks reference `ck-*` skills only in their **Engine** / **Related**
  sections as the fast path. Every playbook's core logic must be executable by a
  plain agent — the skill is enrichment, not gating.

When an agent finds a playbook, template, or plan that mandates a `ck-*` skill
before it can run, treat it as a **defect** — refactor the file or open a backlog
entry. Decision record: `docs/decisions/ck-skill-engine-not-vendored.md`.

## How ck-Skills Bind As Engine

For each step, `docs/process/WORKFLOW.md` names an **Engine** (a `ck-*` skill or a global
agent). At run time:

1. `install-harness.sh` already ran the preflight. If `~/.claude/skills`
   exists, the named `ck-*` skill is the **fast path**.
2. `stage-runner` invokes the skill to produce the step's artifact at the path in
   `docs/process/WORKFLOW.md`.
3. If the skill is **absent** (preflight warned), the role's global agent runs
   the playbook's core logic instead and produces the same artifact shape.

The skill never owns the contract (giao kèo — chuẩn bắt buộc) — the **artifact
path + shape** in
`docs/process/WORKFLOW.md` and the **token grammar** (ngữ pháp token truy vết) in
`docs/about/TRACE_SPEC.md` are the
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

Every playbook carries a lifecycle status (trạng thái vòng đời) so readers know
whether the guidance
was exercised on real work or is still a paper proposal. The status is a single
grep-able line near the top:

```markdown
**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none
```

| State | Meaning |
|---|---|
| `experimental` | (thử nghiệm) Shipped but not yet exercised on a real step. Treat as proposal. |
| `verified` | (đã kiểm chứng) Used on ≥1 real step with no Variant amendment required. Safe to follow as-is. |
| `deprecated` | (khai tử — ngừng dùng) Superseded by a newer playbook, or accumulated 2+ Variant amendments without convergence. Do not start new work from it. |

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
(`docs/process/WORKFLOW.md`), per-step goal text (`docs/process/STAGE_GOALS.md`), templates and
playbooks. Macro 2 executes through the **build-manifest** (bản kê thi công —
compiled at 2.3
from the frozen spec) and the **`/build-phase` loop** (one manifest phase per
isolated invocation) on top of the **walking-skeleton (bộ xương biết đi — app
tối thiểu chạy được đầu-cuối) stack template** (khung code mẫu)
(`scaffolds/stack-pnpm-nest-next/` in the harness source, scaffolded (dựng khung
sẵn) at 2.4).
Macro-1 weight is lane-scaled (`docs/process/WORKFLOW.md` § Lanes: Full vs Lite).

Conditional enterprise gates (data-migration/cutover (chuyển đổi sang hệ mới),
NFR/load (Non-Functional Requirements — yêu cầu phi chức năng / kiểm tải), DR
(Disaster Recovery — khôi phục sau thảm họa) + RTO/RPO (mục tiêu thời gian/điểm
phục hồi),
compliance/privacy/WCAG (chuẩn tiếp cận cho người khuyết tật), observability/SLO
(Service Level Objective — mục tiêu mức dịch vụ)) live mostly in Build & Go-live
and
Post-Build. Each must be explicitly marked **N/A by decision** when not needed —
never silently dropped.

## Status Artifact — the human tracking surface

> **Note (2026-09-01):** the `ops-board/` scaffold that implemented this was removed
> as unverified (never run on real data). The design below stays as reference; a
> project builds its own surface if it needs one.

The reports under `plans/reports/` are the machine's memory — dense, per-phase,
read on demand. The human running the build needs the opposite: **one glanceable
page that is always current**, so tracking progress never means scrolling a
transcript or opening files. That page is a **status Artifact** (bản trạng thái
— dashboard tự-đủ, luôn cập nhật) — a self-contained
hosted dashboard, anchored to the session, that the operator bookmarks and the
team can be shown.

Practice (brief): stand it up **early** (not at the end), **refresh at every milestone** (re-publish the SAME file so the URL/bookmark stays stable), **mirror truth, never narrate ahead** (a capability is "live" only when its verify-at-source check passes — **FC6**), and write it in the **operator's language** (gloss jargon). Full contents checklist + curation recipe: the playbook `playbooks/status-surfaces-ops-and-client.md` (the HOW) — this section is the authority (the WHY).

### Two surfaces — internal ops-board vs client-facing roadmap

The status Artifact above is the **internal ops-board** (bảng điều hành nội bộ):
full engineering truth
for the *team* — phase IDs, SHAs, harness versions, deploy state, gate results,
the operator's-language gloss. It reveals everything.

A client must never be handed that surface. So the harness keeps a **second,
separate Artifact — the client-facing roadmap** (lộ trình cho khách) — a
*curated* (đã biên tập/chọn lọc) view the delivery
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

Curation rules, the phase→value-bucket recipe, and ownership (PM compiles the client roadmap, CS forwards it to the client) live in the playbook `playbooks/status-surfaces-ops-and-client.md` (the HOW). Both surfaces mirror the SAME verified facts — the client is never handed the internal board.

## Locked Decisions

Shorthand labels cited across the docs (`D1`…`D6`). These are settled — an
audit or refactor does not silently reverse them:

| # | Decision |
|---|---|
| **D1** | Independence Principle (nguyên tắc độc lập) — `ck-*` skills are accelerators, never dependencies; the harness runs on a bare agent + git + bash. |
| **D2** | Balanced process — enterprise gates are **conditional** (có điều kiện): cleared or explicitly `N/A by decision`, never silently dropped. |
| **D3** | Token scheme (sơ đồ token truy vết) — `GAP-NNN → REQ-ID (MODULE.AREA.NN) → SC-NNN → TC-NNN`, `CR-NN`; `US-NNN.REQ-MMM` is not used. |
| **D4** | Bilingual split (tách song ngữ) — client-facing surfaces fork to `locale-vi/`; internal technical artifacts stay English; IDs/paths/code stay EN everywhere. |
| **D5** | SA (System Analyst — phân tích hệ thống) and Tech Lead are separate named roles (ERD (Entity Relationship Diagram — sơ đồ quan hệ thực thể) freeze vs stack/API/threat-model — mô hình mối đe dọa). |
| **D6** | Engine is preflight-checked, never vendored — `install-harness.sh` warns about missing skills/agents but never copies them. |

## Growth Rule

The harness grows from friction (vướng mắc — chỗ agent bị cấn/lặp lại). When an
agent is confused, repeats manual
reasoning, finds a missing rule, or hits a recurring failure, it must improve the
harness directly or record the friction. The capture mechanism is the **Friction**
field in every session trace (vết phiên) (`docs/about/TRACE_SPEC.md`); friction that
should become
work graduates into a plan or a decision. Harness-version changes are logged in
`docs/about/HARNESS_CHANGELOG.md` (one entry per hardening round (vòng gia cố), naming
the failures
it closes). Full per-round version history + the failure-class taxonomy live in `docs/about/HARNESS_CHANGELOG.md` (one entry per hardening round); do not inline them here.

### Growth must be measured, not remembered

The rule above describes how the harness **changes**. It says nothing about
whether a change **helped** — and for v7.0…v7.2 nothing did. Every round had a
sound rationale; none had evidence. That gap has a cost that compounds: with no
way to show a rule is dead weight, the only safe move is to add rules, never
retire them, so the doc tree grows monotonically and the context bill with it.

So a harness patch is not finished at re-propagation. It is finished when the
next runs can be **compared against the ones before it**:

- **`scripts/run-log.mjs`** — one JSONL line per dispatch (`start` / `end`),
  written outside git and shared across repos, keyed by the harness version it
  auto-reads from `HARNESS_CHANGELOG.md`. `report` groups by version so a patch's
  effect (completion rate, QC failures, retries, wall-clock) is a table, not a
  recollection. Usage: `scripts/README.md § run-log.mjs`.
- **Honesty rules bind here too (FC6).** Never fill a field you did not observe —
  a fabricated metric is worse than a missing one — and treat a thin sample as
  thin: the report warns below ~5 runs or with a single group, and that warning
  is not decoration. Do not retire a rule on 3 data points.

Industry names for this layer are **evals** and **observability**; `run-log.mjs`
is the minimum viable version of both, not the finished article. It is the
instrument the **hill-climbing loop** (`docs/about/OPERATING-MODES.md` § four nested
layers) was missing.

## Control-Plane Failure Classes

Recurring build failures are classified so the harness fixes the **class**, not
the instance (full taxonomy + evidence in `docs/about/HARNESS_CHANGELOG.md`). Two are
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
- **FC7 — make human review real; no rubber-stamp (duyệt cho có, đóng dấu qua
  loa).** A checkpoint that asks the
  operator to "approve" without **surfacing the artifact** (đưa sản phẩm ra tận
  mắt) produces a blind OK.
  Every human gate MUST surface what it is asking about — for UI, the built
  screenshot **side-by-side** with the prototype image (`docs/gates/visual-fidelity.md`
  Tooth B). The machine teeth (assertions, source checks) do the heavy lifting;
  the human judges only what a machine cannot (aesthetics), and only when it is
  actually put in front of them.

## Traceability Tokens

Pointer only — the full grammar, chain, and RTM (Requirements Traceability
Matrix — ma trận truy vết yêu cầu) completeness rule live in
`docs/about/TRACE_SPEC.md`. In short: `GAP-NNN → REQ-ID (MODULE.AREA.NN) → use-case +
RTM row → SC-NNN → feature-register line → SOW line → TC-NNN`, with `CR-NN` for
change requests. **`US-NNN.REQ-MMM` is not used** in this harness.

## Project Doc Mapping

The harness organizes information into process-folders (discovery, intake,
requirements, scope-baseline, visuals, design, stories, decisions). The
global-`CLAUDE.md` convention expects a fixed set of doc names. The crosswalk
(bảng đối chiếu) —
which harness folder backs each expected doc, and which is a living contract
(hợp đồng sống — cập nhật theo hệ thống) vs a
derived view (khung nhìn dẫn xuất) — lives in `docs/README.md`. When in doubt,
the harness layout wins.
