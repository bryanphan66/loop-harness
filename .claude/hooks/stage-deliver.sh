#!/usr/bin/env bash
# stage-deliver.sh — PostToolUse(Bash) hook. After any Bash call, if the latest
# git commit is a stage-boundary commit (per docs/WORKFLOW.md), push the new /
# changed docs/ artifacts in that commit to the human via the channel-abstracted
# notifier (.claude/scripts/notifier-send.sh — Telegram default, swappable).
#
# 3-macro-stage model: the step ID is MACRO.STEP, e.g. 1.4, 1.9, 2.6, 3.1.
# Commit subjects carry the step ID either as a "stepN.M" token or as a bare
# "N.M" token. Build code commits (2.6) fire per-phase and are SKIPPED to avoid
# spam — their delivery is the QA evidence push (qa-deliver.sh), not the diff.
#
# Audience labels follow the client-paging gate map in docs/WORKFLOW.md:
#   client-paging steps (PB-G2 1.9, PB-G3 1.13, PB-G4 1.15, ACCEPTANCE 2.12,
#   HANDOVER 3.1) -> "CLIENT review (forward to customer)"; all others -> self.

set -uo pipefail
trap 'exit 0' ERR

payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Fast bail: not a git commit call.
if [[ "$cmd" != *"git commit"* ]]; then
  exit 0
fi

# Resolve project dir.
sess_cwd=$(printf '%s' "$payload" | jq -r '.cwd // ""')
[[ -d "$sess_cwd" ]] || sess_cwd="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$sess_cwd" || exit 0

git rev-parse --git-dir >/dev/null 2>&1 || exit 0

msg=$(git log -1 --pretty=%B 2>/dev/null || true)
[[ -n "$msg" ]] || exit 0
subject=$(printf '%s' "$msg" | head -n 1)

# Match a MACRO.STEP token: "step1.4", "step 1.4", or a bare "1.4" / "2.10".
# Allow an optional letter suffix (e.g. 2.1b data-migration).
if   [[ "$subject" =~ step[[:space:]]*([0-9]\.[0-9]{1,2}[a-z]?) ]]; then
  step="${BASH_REMATCH[1]}"
elif [[ "$subject" =~ (^|[^0-9])([0-9]\.[0-9]{1,2}[a-z]?)([^0-9]|$) ]]; then
  step="${BASH_REMATCH[2]}"
else
  exit 0
fi

# Drop tokens that are not real WORKFLOW step IDs (e.g. a bare "2.0" from a
# version string like "v2.0"). Only the IDs in docs/WORKFLOW.md route here.
case "$step" in
  1.1|1.2|1.3|1.4|1.5|1.6|1.7|1.8|1.9|1.10|1.11|1.12|1.13|1.14|1.15) ;;
  2.1|2.1b|2.2|2.3|2.4|2.5|2.6|2.7|2.8|2.9|2.10|2.11|2.12|2.13) ;;
  3.1|3.2|3.3|3.4|3.5|3.6) ;;
  *) exit 0 ;;
esac

# Skip noisy / no-single-artifact steps. 2.6 = per-phase build commits.
case "$step" in
  2.6) exit 0 ;;
esac

# Audience label: client-paging steps forward to the customer.
case "$step" in
  1.9|1.13|1.15|2.12|3.1) audience="CLIENT review (forward to customer)" ;;
  *)                      audience="self review" ;;
esac

# Friendly step name (from docs/WORKFLOW.md step tables).
case "$step" in
  1.1)  step_name="Lead capture + intake raw files" ;;
  1.2)  step_name="Intake brief (go/no-go)" ;;
  1.3)  step_name="Discovery interview summary" ;;
  1.4)  step_name="Gap analysis (As-Is vs To-Be, MoSCoW)" ;;
  1.5)  step_name="SRS IEEE-830 + REQ-IDs" ;;
  1.6)  step_name="SRS validation + CLARIFICATIONS" ;;
  1.7)  step_name="Vision / use-cases / glossary / BPMN / RTM" ;;
  1.8)  step_name="Scenario edge-cases (SC-NNN)" ;;
  1.9)  step_name="Feature register + scope baseline (PB-G2)" ;;
  1.10) step_name="Brand + design tokens" ;;
  1.11) step_name="Screen map / flows / RPM / status-flow / ERD draft" ;;
  1.12) step_name="Full-function prototype" ;;
  1.13) step_name="Prototype review + FREEZE (PB-G3)" ;;
  1.14) step_name="Bao-gia + technical overview + contract draft" ;;
  1.15) step_name="Sign contract + deposit (PB-G4 — EXIT Pre-Build)" ;;
  2.1)  step_name="Solution/data arch — ERD freeze" ;;
  2.2)  step_name="Technical design + stack (TDR + threat-model)" ;;
  2.3)  step_name="Implementation plan + DoR" ;;
  2.4)  step_name="Env + IaC + CI/CD + observability/SLO" ;;
  2.5)  step_name="Seed + foundation data" ;;
  2.7)  step_name="Code review (6-dim)" ;;
  2.8)  step_name="E2E from BA docs + user manual (TC-NNN)" ;;
  2.9)  step_name="Independent security review" ;;
  2.10) step_name="QA real-browser + video (DoD)" ;;
  2.11) step_name="Go-live readiness" ;;
  2.12) step_name="UAT + sign-off (ACCEPTANCE)" ;;
  2.13) step_name="Release" ;;
  3.1)  step_name="Handover package (HANDOVER)" ;;
  3.2)  step_name="Hypercare + SLA window" ;;
  3.3)  step_name="Maintenance / steady-state" ;;
  3.4)  step_name="Maintenance proposal" ;;
  3.5)  step_name="Change control (CR-NN)" ;;
  3.6)  step_name="Retro + journal + agent memory" ;;
  *)    step_name="step ${step}" ;;
esac

short=$(git rev-parse --short HEAD 2>/dev/null || echo "?")

# Files changed in HEAD under docs/, excluding the state tracker + READMEs.
mapfile -t changed < <(
  git diff-tree --no-commit-id --name-only --diff-filter=AM -r --root HEAD 2>/dev/null \
    | grep -E '^docs/' \
    | grep -v -E '(^|/)STAGE\.md$' \
    | grep -v -E '(^|/)README\.md$'
)

# Keep only existing, non-empty, under-limit files.
files=()
LIMIT="${NOTIFIER_FILE_LIMIT:-$((50 * 1024 * 1024))}"
for f in "${changed[@]}"; do
  [[ -f "$f" ]] || continue
  size=$(stat -c %s "$f" 2>/dev/null || echo 0)
  (( size > 0 && size < LIMIT )) && files+=("$f")
done

notifier="$sess_cwd/.claude/scripts/notifier-send.sh"
[[ -x "$notifier" ]] || exit 0

if [[ ${#files[@]} -eq 0 ]]; then
  CLAUDE_PROJECT_DIR="$sess_cwd" "$notifier" \
    --message "[Step ${step} boundary] ${step_name}
Audience: ${audience}
Commit: ${short} — ${subject}
(no docs/ files in commit to attach)" >/dev/null 2>&1 || true
else
  caption="[Step ${step}] ${step_name}
Audience: ${audience}
Commit: ${short} — ${subject}
Files: ${#files[@]}"
  CLAUDE_PROJECT_DIR="$sess_cwd" "$notifier" \
    --caption "$caption" \
    "${files[@]}" >/dev/null 2>&1 || true
fi

# Push the next step's gate text (from docs/WORKFLOW.md) so the human knows
# what clears next. Best-effort — silently skip if the map file is absent.
goals_file="$sess_cwd/docs/STAGE_GOALS.md"
[[ -f "$goals_file" ]] || exit 0

# Next-step pointer within the same macro-stage map.
next_step=""
case "$step" in
  1.1)  next_step="1.2" ;;  1.2)  next_step="1.3" ;;  1.3)  next_step="1.4" ;;
  1.4)  next_step="1.5" ;;  1.5)  next_step="1.6" ;;  1.6)  next_step="1.7" ;;
  1.7)  next_step="1.8" ;;  1.8)  next_step="1.9" ;;  1.9)  next_step="1.10" ;;
  1.10) next_step="1.11" ;; 1.11) next_step="1.12" ;; 1.12) next_step="1.13" ;;
  1.13) next_step="1.14" ;; 1.14) next_step="1.15" ;; 1.15) next_step="2.1" ;;
esac
[[ -n "$next_step" ]] || exit 0

# Pull the "## Step <id>" goal block from STAGE_GOALS.md if it exists there.
next_goal=$(awk -v s="$next_step" '
  $0 ~ ("^## (Step )?" s "([^0-9]|$)") { p=1; next }
  p && /^## / { exit }
  p && /^Goal:/ { sub(/^Goal:[[:space:]]*/, ""); g=1; print; next }
  g && /^$/ { exit }
  g { print }
' "$goals_file")

if [[ -n "$next_goal" ]]; then
  CLAUDE_PROJECT_DIR="$sess_cwd" "$notifier" \
    --message "[Next step ${next_step}] goal:

${next_goal}" >/dev/null 2>&1 || true
fi

exit 0
