#!/usr/bin/env bash
# qa-deliver.sh — Stop hook. When a turn ends, scan plans/reports/ for new .mp4
# recordings (per the canonical-e2e / QA field-by-field playbook convention:
# plans/reports/<feature>-<runId>.mp4 + sibling .md report) and push them to the
# human via the channel-abstracted notifier (.claude/scripts/notifier-send.sh)
# so the human knows "task done, here is the proof".
#
# This is the QA evidence surface for step 2.10 (real-browser QA + video) — the
# DoD gate proof. Build code commits (step 2.6) are skipped by stage-deliver.sh;
# their delivery is this video push, not a diff.
#
# Cache at .claude/.qa-sent keeps `path:size` keys of already-sent files so a
# re-run that produces a fresh recording (different size) gets sent again, but
# unchanged ones do not repeat.

set -uo pipefail
trap 'exit 0' ERR

# Auto-load .claude/.env so NOTIFIER_CHANNEL / channel creds resolve.
env_file="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
fi

cwd="${CLAUDE_PROJECT_DIR:-$(pwd)}"
reports_dir="$cwd/plans/reports"
cache="$cwd/.claude/.qa-sent"
notifier="$cwd/.claude/scripts/notifier-send.sh"

[[ -d "$reports_dir" ]] || exit 0
[[ -x "$notifier" ]] || exit 0
touch "$cache" 2>/dev/null || exit 0

# Recordings modified in the last 30 minutes — wide enough to catch this
# session, narrow enough to skip ancient files.
mapfile -t recent < <(find "$reports_dir" -maxdepth 3 -type f -name "*.mp4" -mmin -30 2>/dev/null)
(( ${#recent[@]} > 0 )) || exit 0

LIMIT="${NOTIFIER_FILE_LIMIT:-$((50 * 1024 * 1024))}"

for mp4 in "${recent[@]}"; do
  size=$(stat -c %s "$mp4" 2>/dev/null || echo 0)
  (( size > 0 )) || continue

  key="${mp4}:${size}"
  if grep -qxF "$key" "$cache" 2>/dev/null; then
    continue
  fi

  stem="${mp4%.mp4}"
  name=$(basename "$stem")
  rel="${mp4#$cwd/}"

  # Companion report .md sharing the same stem, if present.
  report=""
  [[ -f "${stem}.md" ]] && report="${stem}.md"

  caption="[Task verified] ${name}
E2E recording (and report if present) attached
Path: ${rel}"

  if (( size > LIMIT )); then
    # Channel caps file size. Send text-only notice + the report only.
    CLAUDE_PROJECT_DIR="$cwd" "$notifier" \
      --message "[Task verified — recording too large] ${name}
size: ${size} bytes (over notifier file cap)
path: ${rel}
Open locally or upload manually." >/dev/null 2>&1 || true
    if [[ -n "$report" ]]; then
      CLAUDE_PROJECT_DIR="$cwd" "$notifier" \
        --caption "Report for ${name}" \
        "$report" >/dev/null 2>&1 || true
    fi
  else
    if [[ -n "$report" ]]; then
      CLAUDE_PROJECT_DIR="$cwd" "$notifier" \
        --caption "$caption" \
        "$report" "$mp4" >/dev/null 2>&1 || true
    else
      CLAUDE_PROJECT_DIR="$cwd" "$notifier" \
        --caption "$caption" \
        "$mp4" >/dev/null 2>&1 || true
    fi
  fi

  echo "$key" >> "$cache"
done

exit 0
