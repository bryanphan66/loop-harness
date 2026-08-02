# scripts/

Harness install + verify-gate machinery. Two scripts plus the git hooks under
`.githooks/` that drive them.

| File | Role |
|---|---|
| `install-harness.sh` | One-command bootstrap of the harness skeleton into a new (or existing) project. |
| `harness-verify-gate.sh` | The non-bypassable Pre-Close Verification Gate. Invoked by the git hooks. |
| `../.githooks/pre-commit` | Runs the verify gate at commit time (lint + register + atomicity). |
| `../.githooks/pre-push` | Runs the verify gate at push time (lint + **test suite** + register). |

---

## install-harness.sh — bootstrap a project

Copies the harness skeleton (`AGENTS.md`, `STAGE.md` template → root `STAGE.md`,
`docs/`, `.claude/`, `.githooks/`, `scripts/`) into a target directory, wires the
verify gate, and prints the first `/goal`.

```bash
# Greenfield: new project from a clone of this harness
scripts/install-harness.sh --bootstrap ./my-new-project

# Drop a raw client spec into docs/discovery/ on the way in (VN diacritics
# are ASCII-folded for grep-friendly slugs)
scripts/install-harness.sh --bootstrap --spec ./brd.docx ./my-new-project

# Mix several inputs — repeat --spec; directories contribute their top-level files
scripts/install-harness.sh --bootstrap --spec ./inbox/ --spec notes.md ./proj

# Add the skeleton to an EXISTING repo without touching its history
scripts/install-harness.sh --directory /path/to/existing --merge --yes

# Preview only — write nothing
scripts/install-harness.sh --dry-run --bootstrap ./preview

# Remote — NO local clone needed. Fetches the repo tarball into a temp dir.
# HARNESS_REPO (owner/repo) is required; authenticate first for a private repo
# ('gh auth login' or export GH_TOKEN), then pull the script and pipe to bash:
gh api repos/<owner>/<repo>/contents/harness/scripts/install-harness.sh \
  -H "Accept: application/vnd.github.raw" \
  | HARNESS_REPO=<owner>/<repo> bash -s -- --bootstrap ./my-new-project
```

### What `--bootstrap` does

1. **Preflight** — checks `~/.claude/skills` + `~/.claude/agents` exist and
   **warns** if missing. The `ck-*` skills are the **live engine**, invoked from
   your global `~/.claude` — **never copied/vendored** into the project
   (Independence Principle, decision D1/D6). The harness still runs on a bare
   agent + git + bash; the skills are accelerators.
2. **Copy skeleton** — discovers the skeleton paths that exist in the source and
   mirrors them, skipping the source repo's own scratch (`.git/`, `plans/`,
   private `.claude/.env` + `settings.local.json`).
3. **`git init`** — only if `.git` is missing. Sets `core.hooksPath=.githooks`
   so the verify gate is active.
4. **STAGE.md** — copies `docs/templates/STAGE.md` to the repo root and fills the
   Snapshot for a fresh Pre-Build project.
5. **`.claude/settings.local.json`** — writes it with the notifier hooks
   pre-registered (gitignored — fill `.claude/.env` to activate).
6. **Baseline commit** — auto-commits the skeleton **only when it created
   `.git`**, so an existing repo's history is never touched. This single
   baseline commit uses `--no-verify` (no behavior to verify yet, and the gate's
   own hook files are what's being committed); **every later commit runs the
   gate**.
7. **Prints the first `/goal`** — the Pre-Build intake-brief goal to paste into
   Claude Code.

### Flags

| Flag | Effect |
|---|---|
| `-d, --directory <path>` | Target directory (default: current dir). |
| `-y, --yes` | Accept defaults, skip prompts. |
| `--bootstrap` | Greenfield bootstrap (implies `--override` + `--force` + `--yes`). |
| `--spec <path>` | With `--bootstrap`: copy a file or directory of files into `docs/discovery/`. Repeatable. |
| `--merge` | On conflict, keep existing files, copy only missing ones. |
| `--override` | On conflict, back up and replace protected paths. |
| `--force` | Overwrite existing files after backing them up. |
| `--dry-run` | Show what would change; write nothing. |

> **Local vs remote source.** Run from a **local clone** (local mode — the common
> case) and the installer copies from the checkout. Run it **standalone** (no
> clone in scope — `curl|bash`, or a lone copy of the script) and it **fetches the
> repo as a tarball into a temp dir**, then installs with the same copy logic — so
> you don't need the harness repo checked out (set HARNESS_REPO=owner/repo). The fetch tries, in order: `gh`
> (your auth — **works for the private repo**), a token in `GH_TOKEN`/`GITHUB_TOKEN`,
> then an anonymous tarball (public repos only). Override the source with
> `HARNESS_REPO=owner/repo` and `HARNESS_REF=branch`. See
> `docs/decisions/remote-install-from-repo-tarball.md`.

---

## harness-verify-gate.sh — the gate

The mechanical Pre-Close Verification Gate. Git invokes it via the hooks;
it exits non-zero to **block** the commit/push.

**Self-check (fail-closed) runs first.** Before any gate, the script verifies it
is actually **armed**: `core.hooksPath` must resolve to the harness `.githooks`
(path-normalized, so an absolute `.githooks` still counts). If a `husky` install
re-pointed `core.hooksPath` to `.husky/_`, the gate stays armed only when a
`.husky` hook chains it — otherwise the gate **BLOCKS** rather than let a future
commit silently skip it. An unarmed/undetectable gate is treated as a failure,
never a pass.

Gates that run:

1. **Lint / typecheck / quick-validate** (every call) — auto-detected per stack:
   `npm` / `yarn` / `pnpm` (script `validate` > `lint` > `typecheck` > `check`),
   `make` (`validate` / `lint` / `check`), `cargo` (`clippy -D warnings`), or
   **none** (skipped — the harness stays runnable on a bare project). Blocks on
   failure.
1b. **Test suite — on PUSH only.** pre-push additionally runs the project's
   `test` script (e2e / Playwright-fidelity included) so a green lint can't stand
   in for green behaviour. Kept off pre-commit so commits stay fast; the push is
   the last backstop before work is shared.
2. **Verification Register integrity** — parses
   `docs/TEST_MATRIX.md` § Verification Register. Blocks on any `Result: fail`
   row. On a **stage-close commit** (`STAGE.md` staged) it also blocks any
   `never-run` row **and a zero-row register** — a stage cannot close with
   unproven (or entirely absent) behavior.
3. **Stage-boundary atomicity** — on a stage-close commit, `docs/ROADMAP.md`
   must be staged in the **same** commit as `STAGE.md`. The current-stage pointer
   and module progress advance together or not at all
   (`docs/WORKFLOW.md` § Always-On Layer).

Run it by hand any time:

```bash
bash scripts/harness-verify-gate.sh pre-commit   # lint + register + atomicity
bash scripts/harness-verify-gate.sh pre-push     # lint + test suite + register
```

### Bypass policy — humans only

`git commit --no-verify` (or `-n`) and `git push --no-verify` skip the hook
entirely. This escape is reserved for the **human**, who must state an explicit
reason in the conversation. **Agents MUST NOT** bypass a blocked gate — do not
pass `--no-verify`, and do not unset `core.hooksPath`. A red gate means real
work remains: fix the lint error, run the Verify command and record
`Result: pass`, or stage `docs/ROADMAP.md` alongside `STAGE.md`
(AGENTS.md § Verify Gate — No Bypass).

---

## Stack support (Gate 1 auto-detection)

| Detected | Command tried (first match wins) |
|---|---|
| `package.json` + `pnpm-lock.yaml` | `pnpm run <validate\|lint\|typecheck\|check>` |
| `package.json` + `yarn.lock` | `yarn <validate\|lint\|typecheck\|check>` |
| `package.json` | `npm run <validate\|lint\|typecheck\|check> --silent` |
| `Makefile` | `make <validate\|lint\|check>` |
| `Cargo.toml` | `cargo clippy --quiet -- -D warnings` |
| none of the above | skipped (no validate command — not a failure) |

`jq` is used to read `package.json` scripts when present; the gate falls back to
`grep` when `jq` is absent.
