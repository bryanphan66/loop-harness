# `.claude/` — automation the harness SHIPS into a project

Wiring that runs the control plane for agents working in an installed project.
NOT the workshop's own dev-session config (that is the repo-root `.claude/`).

## commands/ — slash commands the operator/agent runs
| File | Command | What it does |
|---|---|---|
| `stage-next.md` | `/stage-next` | Run the next `docs/process/WORKFLOW.md` step via the `stage-runner` subagent, enforce its gate, update `STAGE.md`, land one stage-boundary commit. |
| `build-phase.md` | `/build-phase` | Build step 2.6 — implement ONE `build-manifest.md` phase (code → validate → e2e smoke → verification-register → commit → phase-acceptance). Repeat until the manifest is done. |
| `gate-check.md` | `/gate-check` | Verify any gate on demand. |

## agents/ — project-local subagent
| File | What it does |
|---|---|
| `stage-runner.md` | Runs one WORKFLOW step in an isolated context (reads the step goal + relevant playbook, writes artifacts, returns a ≤200-word summary) so the 10-30k tokens of step work never land in the main session. |

## hooks/ — event-driven automation
| File | Fires on | What it does |
|---|---|---|
| `stage-deliver.sh` | PostToolUse(Bash) | On a stage-boundary commit, push the new/changed `docs/` artifacts + the next step's gate text to the human's phone. |
| `qa-deliver.sh` | Stop | Scan `plans/reports/` for new demo `.mp4` recordings + sibling report and push them. |
| `context-monitor.sh` | UserPromptSubmit | Estimate context fill from the transcript, warn at 40/60/80/95% via the notifier. |
| `notify.sh` | Notification + Stop | Push "needs attention" + `MANUAL_CHECKPOINT` alerts to the human. |

## scripts/ — hook support
| File | What it does |
|---|---|
| `notifier-send.sh` | Channel-abstracted notifier (Telegram default, swappable) that every hook calls — a thin interface so the harness is not bound to one push channel. |

## config
- `settings.json` — minimal (`worktree.bgIsolation: none` so a bg agent works at the checked-out root and the verify gate stays live).
- `settings.local.json` — **gitignored**; written by `install-harness.sh` with the notifier hooks + per-machine paths.
- `.env.example` — copy to `.env` (gitignored) + fill notifier/context tokens. Secrets live here only.
- `.gitignore` — shields secrets + local sentinels.
