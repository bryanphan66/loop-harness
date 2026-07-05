# Session Retrospective Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Structured checklist an agent runs at the end of a multi-task session to capture
> cross-task insight before the session memory disappears. Owns Post-Build **step
> 3.6** (retro + journal + agent memory); also runs at any multi-task
> stage-boundary.

**Macro-stage / step:** Post-Build · 3.6 — and always-on at the end of any
multi-task session in any macro-stage.

> **Increment note:** the Post-Build macro-stage detail is built next increment;
> this checklist ships now because it runs across all three macro-stages (every
> multi-task session ends with it per `docs/WORKFLOW.md` § Always-On).

## Engine

- **Fast path:** `retro` (data-driven retrospective from git history) + `journal`
  (technical session reflection).
- **Role:** Docs/Audit. **Bare-agent fallback:** walk the section template below
  by hand from `git log`. Per D1 the skills are accelerators.

## When To Run

Run when EITHER holds:

- The session produced 3+ commits.
- The session spanned multiple intake items (one task triggered a decision, that
  decision triggered a plan, that plan touched multiple files).

Skip a single-task session with one focused change — the per-task `Trace` block
(`docs/TRACE_SPEC.md`) is sufficient.

## When NOT To Use

This is for the agent that did the work, at session end. It is not a code review
(`code-review-scoring.md`), not a project status snapshot, not a per-step QA
report.

## Output Shape

Save to `plans/reports/retro-<YYYYMMDD>-<HHMM>-<topic-slug>.md`. Keep each section
terse — sacrifice grammar for concision. Empty sections are valid signals ("no
friction" is useful data); write "none" explicitly rather than omit.

```markdown
# Session Retrospective — <topic-slug>

**Date:** YYYY-MM-DD · **Commits:** N · **Branch:** <branch> · **Macro-stage:** <Pre/Build/Post>

## Tasks Completed
One line each; cite commit SHAs where useful.

## Friction Encountered
Per friction point: What (1 sentence) · Where (file/command/step) · Root cause
(or "unknown — needs investigation") · Recurring? (first / second / 3+) ·
Suggested capture (existing playbook / new playbook / backlog / decision / nothing).

## Playbooks Used
Per playbook: path · Lifecycle on entry · UX rating (worked-as-written /
needed-Variant / failed) · Promote? (experimental → verified candidate?) ·
Variant added? (link / no).

## Lifecycle Promotion Candidates
Each `experimental` playbook exercised this session without modification —
candidates to promote to `verified` in this commit batch (see
`docs/HARNESS.md` § Playbook Lifecycle).

## Backlog Candidates
Per missing harness capability: Title · one-line problem · demand evidence
(hits this session + prior) · promotion check (meets threshold yet?).

## Decisions Made
Per decision-class change: decision SLUG + title · consequence ladder (which
downstream files / plans now need attention).

## Recommendations For The Next Agent
A specific instruction / a playbook draft / a backlog entry. If everything ran
smoothly: "none — session ran clean".

## Open Threads
Items the session did not close; each links to where it lives now.

## Trace
One trace block per `docs/TRACE_SPEC.md`, self-scored to the highest lane the
session touched. The durable evidence record — files read/changed, verify command
+ result, friction, outcome, N/A-by-decision marks. One consolidated trace for a
multi-task session is enough.
```

## Steps To Run

1. `git log --oneline <session-start>..HEAD`; note what task each commit served.
2. Walk the template top-to-bottom; skip none.
3. Apply Lifecycle Promotion Candidates immediately — open each affected playbook,
   update its `Lifecycle:` line + `First use` field; commit the lifecycle change
   with a clean separate diff.
4. Apply Backlog Candidates that meet the threshold; stage the rest as proposed.
5. Save the retro at the canonical path; reference it in any downstream decision.

## Pitfalls

- **Thin retros.** Empty-because-skipped sections make the file untrustworthy.
  Always write "none" explicitly.
- **Retro-as-changelog.** The git log already lists commits; this is about insight.
- **Premature lifecycle promotion.** One self-use on a contrived example does not
  satisfy the rule — the real use must come from work that would have happened
  anyway.
- **Decision creep.** Only promote insight to a `docs/decisions/<slug>.md` when it
  changes operating model or architecture direction.

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original recipe.)

## Related

- `docs/HARNESS.md` § Growth Rule — the principle this mechanizes; § Playbook
  Lifecycle — the promotion target this checks.
- `docs/TRACE_SPEC.md` § Trace Block — the trace this consolidates.
- `docs/WORKFLOW.md` § 3.6 / Always-On — the step this playbook owns.
- `docs/ROLE_MAP.md` — Docs/Audit role + `retro` / `journal` engine binding.
