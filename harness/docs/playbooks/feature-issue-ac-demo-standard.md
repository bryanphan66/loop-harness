# Feature -> Issue -> AC -> Demo-Media Standard

**Lifecycle:** verified · **First use:** elearning 2026-07 · **Verified by:** elearning UAT delivery

> The end-to-end chain from a frozen feature to a client-testable issue with
> acceptance criteria and demo media. Defines the SoT sync, the issue body format,
> and the one-spec-per-AC media pipeline. Owns the tracker+demo slice of 2.x/3.x.

**Macro-stage / step:** Build & Go-live (2.x) + Handover (3.1). **Gate it serves:**
DoD (traceable issues + UAT evidence). Shape: **structural framework**.

## Engine

- **Fast path:** `ck-scout` (register parse) + a sync script (`feature-issues-sync.mjs`
  shape) + `web-testing` (Playwright recordings) + `media-processing` (ffmpeg frame).
- **Bare-agent fallback:** the global agent parses the register, syncs issues, and
  records one spec per AC.

## When To Run

Standing up the feature tracker (GitHub issues) + client UAT board (PM tool) + the
per-AC demo media. **Skip when:** there is no external tracker or no demo requirement.

## 1. Feature-register = Source of Truth

Each feature row is stable, machine-readable data:
`id` (F-NNN, **durable** — never reused/renumbered), `reqids` (REQ-ID grammar,
e.g. `CM.CRUD.01-03`), `goal` (user story), `ac[]` (acceptance criteria),
`scope_in` / `scope_out`, `deps`. Everything downstream derives from here.

## 2. GitHub Issues = SoT for features (idempotent sync)

A sync script (shape of `scripts/feature-issues-sync.mjs`) reconciles register -> issues:

- **Durable join via a hidden marker** `<!-- feat-id: F-NNN -->` in the body — a
  feature can be renamed or change module and still match its existing issue.
- **Body template:**
  ```
  **Mục tiêu (User story):** {goal}
  **Module:** {module}  |  **Phase:** {phase}  |  **REQ-ID:** {reqids}

  <acceptance-criteria checklist>
  <!-- feat-id: F-NNN -->
  ```
- **`--rebuild` overwrites the body ONLY when the issue was not hand-edited** — never
  clobber human edits.
- **Labels + fields:** GitHub labels = `github` + `plane` ONLY; Feature/Bug/Enhancement = **Issue Type**, Module = **body**, Phase = **Milestone**. Full authoring rule + reconcile steps: `github-issue-standard.md` §3-4 (the owner). (Plane keeps Feature/Bug/Enhancement labels — no native Type — intentional asymmetry.)

## 3. PM-tool Issues = client UAT (1:1 with GitHub F-NNN)

- The client board holds **F- items only** (delete ad-hoc non-F tickets — findings
  live in reports + git). Keep it 1:1 with the GitHub feature set.
- **Issue body** = goal + the ACs as a **tickable checklist** + a per-AC user-guide
  (HDSD) link + the staging URL. State includes an **In Review** stage = "ready for
  client acceptance". Modules are domain-based.
- **PM-tool API caveats (Plane, verified):** a task-list renders from tiptap markup
  `<ul class="task-list" data-type="taskList"><li class="task-list-item"
  data-type="taskItem" data-checked="false">...`; `description_stripped` is NOT derived
  from `description_html` (verify by html length, not stripped); **Pages cannot be
  created via the API key** (web session only) — export markdown for a human to paste.

## 4. Demo-media pipeline: ONE Playwright spec per AC is the SINGLE source

There is **no separate "screenshot code" and "video code"** — one spec produces both.

- Each AC = one spec `demo-f<NNN>-ac<M>.spec.ts` that drives the exact operator steps,
  with Playwright `video: 'on'` -> records a `.webm` of the run. This is the ONLY source.
- **Post-run (not a second Playwright pass):**
  1. Upload the `.webm` to Drive -> a **Demo link** attached to the issue.
  2. `ffmpeg` cuts **one frame** -> `.webp` -> stored at the guide's `shots` path.
- The guide (HDSD) text (steps + expected result) is hand-authored; `shots` starts empty
  and is filled by the frame extraction.
- **Update rules:**
  - Text-only change -> edit the guide file, do NOT touch Playwright.
  - UI changed / need fresh image+video -> fix that ONE spec (selectors/steps), run it
    ONCE -> new video + new frame (the `.webp` overwrites the same path, so the guide
    needs no path change). **One run refreshes BOTH the image and the video.**

## 5. Token-chain (extends `TRACE_SPEC.md`)

`feature-register REQ-ID -> AC -> issue (GitHub SoT + PM-tool UAT) -> per-AC HDSD block
-> one demo spec/AC -> video + webp`. Every AC is traceable end to end; a broken link
(AC with no issue, no guide block, or no demo spec) is a DoD gap.

## Cross-Project Use

Portable. The register schema, the hidden-marker sync, the 1:1 UAT board, and the
one-spec-per-AC media rule apply to any project with an external tracker + demo needs.
