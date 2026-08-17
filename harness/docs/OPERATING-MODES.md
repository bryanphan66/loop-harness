# Operating Modes & the Loop

> This harness (khung vận hành cho AI agent) product name and repo slug is **loop-harness**. The name reflects its center of gravity: value converges in **the loop** (vòng lặp tự-sửa) (Mode B — chế độ B), not the linear build.

How this harness runs a project. **The single operating spine is the two modes (chế độ) below (Mode A → go-live (thời điểm app lên môi trường thật) → Mode B).** Two older framings are kept but SUBORDINATE — not parallel models competing with the spine:
- the **3 macro-stages** (3 macro-giai đoạn: Pre-Build / Build / Post-Build) are just the *step grouping inside the modes* — Mode A = macro 1→2, Mode B = macro 3's continuous parts (`WORKFLOW.md` details the numbered steps);
- **Loop Engineering** (kỹ nghệ vòng lặp — the `prompt → context → harness → loop` **nested layers**, lớp bọc nhau) is a *diagnostic lens* (lăng kính chẩn đoán), demoted to the box near the end — use it to ask "which layer owns this failure", not as a thing to run.

New readers: start at `UNDERSTANDING-loop-harness.md` (narrative + honest PROVEN/PATCHED/ASPIRATIONAL (đã kiểm chứng / vá-từ-bài-học / chưa-làm) scorecard).

## Two modes
The harness runs a project in **two distinct modes** with different drivers, trackers, and gates (chốt kiểm — điều kiện phải đạt mới qua). Conflating them is what let elearning's `STAGE.md` fossilize (it kept naming a "current step 1.13" for a project already live and moved to a queue).

```text
   Mode A — BUILD (finite, convergent)          Mode B — STEADY-STATE (perpetual = THE LOOP)
   Macro 1 -> Macro 2 ................ GO-LIVE .............. Macro 3
   driver: /stage-next (stage stepper)  ^switch^     driver: issue-pipeline loop (event-driven)
   tracker: STAGE.md "current step"                 tracker: the issue board (states)
   layers: context + harness            layers: context + harness + LOOP
```

## Mode A — Build (Macro 1 -> 2)
Finite, one-directional: raw spec -> frozen scope + prototype (bản mẫu giao diện) -> ERD (Entity Relationship Diagram — sơ đồ quan hệ thực thể) -> walking skeleton (bộ xương biết đi — app tối thiểu chạy được đầu-cuối) -> phase (pha/giai đoạn build) loop -> review/security/QA (Quality Control — kiểm thử chất lượng) -> UAT (User Acceptance Testing — khách nghiệm thu) -> **release**. Driven by **`/stage-next`** stepping through `WORKFLOW.md` (1.1 .. 2.13). Progress = one moving "current step" in `STAGE.md`. Gates = PB-G1..G4, DoR/DoD (Definition of Ready/Done — điều kiện sẵn-sàng/hoàn-thành), phase-acceptance.

Mode A is **convergent** (hội tụ — get to done once) so it is mostly a linear stepper, NOT a loop — the one genuine loop inside it is the **`/build-phase`** cycle at step 2.6 (code a phase → verify its acceptance → next phase). This is what the harness already does well.

## Mode B — Steady-state (Macro 3) = THE LOOP
Begins the moment Macro 2 ships a running app to a persistent env (**go-live = the graduation point**). From here the project is **built**; the job is to keep it healthy while it evolves — a perpetual, divergent (phân kỳ, không hội tụ) loop, NOT a linear stage-loop. There is no single "current step"; there is a **queue of change items in parallel states**.

Macro 3's one-time ceremonies (**3.1 handover, 3.2 hypercare kickoff, 3.6 retro**) still run once via `/stage-next`. But **3.3 steady-state (trạng thái vận hành ổn định sau go-live) + 3.5 change-control are CONTINUOUS** — they ARE the loop, run as the **issue-pipeline** (dây chuyền xử lý phiếu việc), not stage steps.

### The loop, primitive by primitive
| Loop primitive | Mechanism in this harness | Maturity |
|---|---|---|
| **discover** (phát hiện việc) work | a bug report / change request becomes **one GitHub Issue** (phiếu việc — source of truth / nguồn-tin-duy-nhất) | strong |
| **dispatch** (giao việc cho agent) to a sub-agent | control session dispatches one async coder per issue (own worktree); `In Dev` | strong |
| **verify** (kiểm chứng) | **verify-at-source** (xác minh tại nguồn — kiểm cái đang CHẠY) after deploy (running artifact carries the shipped commit) + fail-closed (mặc định CHẶN khi lỗi) gates + QC (kiểm thử chất lượng) checklist vs Acceptance Criteria (tiêu chí nghiệm thu) | strong (self-correcting) |
| **recover** (tự-sửa khi lỗi) | auto-rollback on health-fail (deploy standard) + retry flaky push; NOT yet auto-re-dispatch on `BLOCKED` | **frontier — thin** |
| **persist state** (lưu trạng thái) | the **issue board** (bảng phiếu việc — 10-state field) + comments (QC checklist, decisions) + `STAGE.md` one-liner | strong |
| **decide next** (quyết việc kế) | control session picks the next issue; QC pass -> advance, fail -> golden rule (luật vàng) | strong (human-in-loop) |

State model (the `States` org Issue Field): `Backlog -> Ready for Dev -> In Dev -> Deploying -> Ready for Test -> QC Testing -> Ready for UAT -> UAT Testing -> Done` (+ `Cancelled`).

### Mode B rules (the ones that bit us — see `lessons-log.md` — sổ bài học)
- **Golden rule (luật vàng) on QC fail:** fail *within* an issue's Acceptance Criteria (AC — tiêu chí nghiệm thu) -> back to `In Dev` on the same issue; fail *outside* its AC -> a new issue (the current one proceeds independently). Not "happy vs edge".
- **Close only at Done.** Reference issues with `Refs #N` / `Part of #N` in **both the PR body AND every commit message** (squash-merge (gộp các commit thành một khi merge) inherits commit keywords -> `Closes` there auto-closes wrongly).
- **BA-validate is upstream** (BA = Business Analyst — phân tích nghiệp vụ; CS + Tech Lead before the issue exists); the loop doesn't re-validate. Business-sensitive items (price/order/permission/data-integrity) are held for a human.
- **Verify-at-source** after every deploy; never trust CI-green / HTTP-200 alone.

## The graduation (Mode A -> Mode B)
At go-live (release 2.13, or the first persistent-env deploy that becomes the working environment):
1. `STAGE.md` Macro-stage flips to **Steady-state (Macro 3)**; drop the "current step" field (meaningless now) and replace with **"Steady-state since <date>; board = <issues link>"**.
2. `/stage-next` stops being the driver; the **loop (issue-pipeline)** takes over.
3. New work enters as **issues**, not stage steps.

A finite "current step" tracker in a live product is the smell that a project graduated but nobody flipped the mode.

## Loop maturity — where we are, where to grow
The loop is strong on **discover / dispatch / verify / persist / decide**. Two frontiers make it a *fuller* loop (the two steps Loop Engineering emphasizes that the harness is thinnest on):

**Frontier 1 — Recover (self-healing — tự-chữa).** Verify catches failure; recover should act on it automatically (design spec: `playbooks/steady-state-issue-pipeline.md` § Recover — R1 dispatch, R2 gate, R3 deploy, bounded-retry (thử lại có giới hạn) then fail-closed):
- auto **re-dispatch on `BLOCKED`/`NEEDS_CONTEXT`** (more context -> simpler task -> stronger model) instead of waiting for a human.
- auto **retry flaky gates** (pre-push integration flake) a bounded number of times before flagging.
- auto **open a follow-up issue** when verify-at-source finds a deployed-but-wrong artifact.

**Frontier 2 — Autonomy (tự-chủ — until-goal, less human-per-turn).** Today a human sits in the QC seat and prompts dispatch. To run more autonomously while keeping the human as the *business* gate only:
- auto-**triage** (tự phân loại) a new technical issue (Backlog -> Ready for Dev) when it is clearly non-business-sensitive (the BA-validate split already exists to decide this).
- auto-**dispatch** Ready-for-Dev technical issues on a schedule (cron routine — lịch chạy tự động), not on a human prompt.
- auto-**generate the QC checklist** on `Ready for Test` (already scripted: `qc-checklist.mjs`) and, where an e2e test (kiểm thử đầu-cuối) exists, **auto-run it** so human QC is reserved for genuinely new/visual behaviour.
- keep the human as the **business gate**: BA-sensitive issues, UAT sign-off, prod releases.

These are development directions, not yet built — do them under Frontier 1 first (a self-healing loop is safer to make autonomous than a fragile one).

## Framing (diagnostic lens): the four nested layers
> This is a **lens for diagnosing the harness, not the operating spine** (the spine is the two modes above). Use it to ask "which layer OWNS this failure?" — e.g. a bg worker hanging on a permission prompt is a *harness* fault, not a thin loop. It mostly re-labels things that already exist; do not treat the 4 layers as steps to execute.

`prompt → context → harness → loop` — **each layer WRAPS the one before it** (lớp bọc, không phải bậc thang). This is the industry framing (LangChain, 2026) and it matters mechanically: an outer layer never replaces an inner one, so **when the loop misbehaves the fix is often one layer IN** (stale state, an ambiguous tool contract, a missing permission), not one more loop.

```text
┌── loop ──────────────────────────────────┐  "run the machine again?"  (goal + stop rule + budget)
│  ┌── harness ─────────────────────────┐  │  "the machine"            (tools · state · gates · verifier)
│  │  ┌── context ─────────────────┐    │  │  "the memory"             (what reaches the model)
│  │  │  ┌── prompt ─────────┐     │    │  │  "the message"            (one input)
│  │  │  └───────────────────┘     │    │  │
│  │  └────────────────────────────┘    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

| Layer | What it designs | Where this harness embodies it |
|---|---|---|
| **Context engineering** (kỹ thuật quản lý ngữ cảnh) | which instructions/data/tools reach the model, minimizing excess | `docs/CONTEXT_RULES.md` (per-step Must/Should/Skip), `.claude/hooks/context-monitor.sh` (40/60/80/95% + next-session seed), on-demand skills + progressive disclosure (hé lộ dần theo nhu cầu); the repo's own `CLAUDE.md`, auto-loaded by cwd |
| **Harness engineering** (kỹ nghệ khung vận hành) | the executable environment around the model (files, git, gates, memory (trí nhớ bền qua các phiên), feedback) | the non-bypassable `harness-verify-gate.sh`, the pnpm stack template (khung code mẫu), `STAGE.md`, gates (PB-G/DoR/DoD), per-repo CI/CD (tự động tích hợp/giao hàng), auto-memory |
| **Loop engineering** (kỹ nghệ vòng lặp) | whether to run the machine again: goal, evidence, stop rule, budget | **Mode B** is the loop; verify-at-source; `scripts/run-log.mjs` (the measurement); Recover R1 still thin = this layer not yet full |

**Diagnose by symptom — which layer owns the fix:**

| Symptom | Owning layer | The fix |
|---|---|---|
| Agent can't reach the right data/tool safely; bg worker hangs asking permission | **Harness** | tool contract, allow-list, sandbox, context injection |
| Progress lost across sessions | **Harness** | durable state, checkpoint, progress artifact, compaction |
| First attempt close but unreliable | **Loop** | external grader + deterministic tests + bounded retry |
| Agent keeps working after success, or stops without proof | **Loop** | evidence-based terminal state + budget-aware stop rule |
| Can't tell whether a harness patch actually helped | **Loop (measurement)** | `run-log.mjs` — replay real runs, compare versions |
| Several specialists must run in a fixed order | *Graph* (not built — see below) | explicit nodes/edges/joins |
| The workflow changes too often to diagram | **Simpler harness** | keep control model-driven; delay graph formalization |

**Why there is no graph layer here (deliberate).** Graph engineering (nodes/edges/joins as an executable topology — LangGraph, AutoGen GraphFlow) is the fourth term in the 2026 vocabulary. This harness does **not** run one, and that is a decision, not a debt: the industry's own first rule is *"do not build a graph before you understand the work"*. Our control flow is carried by `WORKFLOW.md` step tables + gates + a supervisor session, which stays cheap to change. The **one** path stable enough to have earned formalization is the 10-state issue board — so its edges are enforced in `issue-state.mjs` (legal transitions only), and nowhere else. Re-open this when a path has been repeated across 2+ projects unchanged.

## Reference implementation + packaged kit
Proven on **elearning-platform**: `docs/WORKFLOW.md § Quy trình code issue` (state model + rules), `scripts/issue-state.mjs`, `scripts/qc-checklist.mjs`, `.github/ISSUE_TEMPLATE/bug-report.md`, `docs/qc/regression-checklist.md`. Human operating playbook (công thức vận hành tái dùng — in the loop-harness workshop, not shipped): `plans/team-playbook-human-agent.md`.

**Packaged into the harness (reusable):** the project-agnostic (không lệ thuộc dự án) Mode-B kit lives at **`harness/templates/steady-state/`** + the operating manual **`harness/docs/playbooks/steady-state-issue-pipeline.md`**. Copy it in at graduation (tốt nghiệp — thời điểm app chuyển sang Mode B) and set `git config deploy.stagingurl`; the scripts resolve the repo dynamically (`gh repo view`) so they are not project-bound.
