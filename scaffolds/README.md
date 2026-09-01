# scaffolds/ — ready-made code you copy into a new project

These are **starting code**, not documents. When you begin a project, the harness
copies one of these into it so you don't build from an empty folder.

Three folders, three jobs:

## 1. `stack-pnpm-nest-next/` — the app skeleton (start here)
A minimal but **already-running** app: a backend (NestJS + Postgres + login) and a
frontend (Next.js), wired together with tests and Docker.

- **What you get:** an app that boots and can log a user in — nothing more. No real
  features yet; you add those on top.
- **Why start here:** it proves the whole pipe works (DB → API → web → deploy)
  before you write any feature, so a later bug is in YOUR code, not the plumbing.
- **Example:** `install-harness.sh` drops this in → you run `docker compose up` →
  open the site → the seeded admin logs in. That's the "walking skeleton".

## 2. `steady-state/` — the after-launch toolkit
Small scripts used **once the app is live** and you're fixing bugs / small changes
through GitHub issues (the "loop").

- **What's inside:** `issue-state.mjs` (move an issue through its states, blocks
  illegal jumps), `qc-checklist.mjs` (turn an issue's acceptance criteria into a
  QC checklist), `push-retry.sh` + `ship-and-verify.sh` (retry a flaky push;
  confirm the deployed server really runs the new code).
- **When:** copied in at go-live, not at project start.
- **Example:** a bug issue moves `In Dev → Deploying → Ready for Test`, and
  `ship-and-verify.sh` checks staging is actually running the merged commit before
  it flips to "Ready for Test".

## 3. `ops-board/` — a status dashboard (experimental, not proven yet)
A single self-contained HTML page showing project status for the internal team.

- **Honest status:** built, renders in light/dark, but **never run on real data** —
  don't rely on it yet.
- **When:** optional; only if you want a visual internal status page.

---
**Don't confuse with `docs/mau-tai-lieu/`:** those are blank *document* forms (a build
plan, a feature list, a quote) you fill in with words. `scaffolds/` here is *code*.
