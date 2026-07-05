#!/usr/bin/env bash
# context-monitor.sh — UserPromptSubmit hook. Estimate context fill from the
# transcript, warn via the channel-abstracted notifier (.claude/scripts/
# notifier-send.sh) when crossing 40% / 60% / 80% / 95% bands, and at >=80%
# write a next-session seed file plus inject a warning into the model's view so
# the main agent self-regulates (wraps up, commits, writes MANUAL_CHECKPOINT).
#
# Token estimate: reads the latest assistant message's .message.usage block from
# the JSONL transcript and sums input_tokens + cache_creation_input_tokens +
# cache_read_input_tokens — the actual prompt size the model saw (cache reads
# still consume the window). Falls back to bytes/4 only when no usage field is
# present (very fresh session). Honors CONTEXT_WINDOW_TOKENS (default 1000000).
#
# Env knobs (read from .claude/.env or the shell):
#   CONTEXT_WINDOW_TOKENS — default 1000000. Set 200000 for the legacy 200K tier.
#   CONTEXT_WARN_DISABLE  — set to 1 to suppress every warning unconditionally.

set -uo pipefail
trap 'exit 0' ERR

[[ "${CONTEXT_WARN_DISABLE:-0}" == "1" ]] && exit 0

payload=$(cat)
tpath=$(printf '%s' "$payload" | jq -r '.transcript_path // ""')
sess=$(printf '%s' "$payload" | jq -r '.session_id // "unknown"')
cwd=$(printf '%s' "$payload" | jq -r '.cwd // ""')
[[ -z "$cwd" || ! -d "$cwd" ]] && cwd="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[[ -n "$tpath" && -f "$tpath" ]] || exit 0

bytes=$(stat -c %s "$tpath" 2>/dev/null || echo 0)
(( bytes > 0 )) || exit 0

# Usage sum for every assistant turn; take the last line (chronological order).
est_tokens=$(jq -r '
  select(.type=="assistant" and .message.usage) | .message.usage |
  ((.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0))
' "$tpath" 2>/dev/null | tail -n 1)

# Fallback for very fresh sessions with no assistant turn yet.
[[ -z "$est_tokens" || "$est_tokens" == "0" ]] && est_tokens=$(( bytes / 4 ))

# Load shared env (.claude/.env) so CONTEXT_WINDOW_TOKENS / NOTIFIER_* live there.
env_file="$cwd/.claude/.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
fi

WINDOW="${CONTEXT_WINDOW_TOKENS:-1000000}"
(( WINDOW > 0 )) || WINDOW=1000000
pct=$(( est_tokens * 100 / WINDOW ))

band="ok"
if   (( pct >= 95 )); then band="critical"
elif (( pct >= 80 )); then band="high"
elif (( pct >= 60 )); then band="soft"
elif (( pct >= 40 )); then band="notice"
fi
[[ "$band" == "ok" ]] && exit 0

# Dedupe: warn once per band per session. Cache lives in .claude/ (gitignored).
cache="$cwd/.claude/.context-warned"
mkdir -p "$(dirname "$cache")" 2>/dev/null || exit 0
touch "$cache" 2>/dev/null || exit 0

key="${sess}:${band}"
if grep -qxF "$key" "$cache" 2>/dev/null; then
  exit 0
fi

short_sess=$(printf '%s' "$sess" | cut -c1-8)
notifier="$cwd/.claude/scripts/notifier-send.sh"

# Best-effort context lines.
stage_line=""
[[ -f "$cwd/STAGE.md" ]] && stage_line=$(grep -m1 -E 'Current stage' "$cwd/STAGE.md" 2>/dev/null | sed 's/^- \*\*//;s/\*\*//g')
last_commit=$(cd "$cwd" 2>/dev/null && git log -1 --oneline 2>/dev/null || echo "no commits")

case "$band" in
  notice)
    text="[Context] ${pct}% (~${est_tokens} / ${WINDOW} tokens)
Session: ${short_sess}
${stage_line}
Status: NOTICE — ~40% used, no action yet. Keep an eye on long-running stages."
    [[ -x "$notifier" ]] && CLAUDE_PROJECT_DIR="$cwd" "$notifier" --message "$text" >/dev/null 2>&1 || true
    ;;
  soft)
    text="[Context] ${pct}% (~${est_tokens} / ${WINDOW} tokens)
Session: ${short_sess}
${stage_line}
Status: SOFT — plan to /clear within ~1h. Heavy stages (1.12 prototype, 2.6 build, 2.8 E2E) push past 80% fast."
    [[ -x "$notifier" ]] && CLAUDE_PROJECT_DIR="$cwd" "$notifier" --message "$text" >/dev/null 2>&1 || true
    ;;
  high|critical)
    # Write next-session seed so the human can /clear safely.
    seed="$cwd/.claude/PENDING_NEXT_SESSION.md"
    cat > "$seed" <<EOF
# Next-session seed — generated at ${pct}% context fill

Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Session ended: ${short_sess}
${stage_line}
Last commit: ${last_commit}

## Recommended first prompt for the new session

Read this file, STAGE.md, AGENTS.md, and docs/WORKFLOW.md. Resume from the
step shown above. If an active /goal was running when the prior session ran
out of context, re-issue \`/stage-next\` (it auto-detects the next step from
STAGE.md), or paste the matching goal block from docs/STAGE_GOALS.md.

## Open MANUAL_CHECKPOINTs

The prior session may have emitted MANUAL_CHECKPOINT blocks that are still
pending (PB-G2 / PB-G3 / PB-G4 / ACCEPTANCE / HANDOVER). Check your notifier
channel for the full text. Address any offline work BEFORE running the next
step.

## Files just committed

\`\`\`
$(cd "$cwd" && git log --oneline -5 2>/dev/null || echo "(git log unavailable)")
\`\`\`

## Why this seed exists

The context monitor detected the session crossed ${pct}% of its
${WINDOW}-token window. Continuing risks auto-compaction (drops detail) or
model confusion. Starting fresh with this seed + STAGE.md + WORKFLOW.md
restores context in ~5k tokens instead of ~150k.
EOF

    text="[Context] ${pct}% — ${band^^}
Session: ${short_sess}
${stage_line}
Last commit: ${last_commit}

RECOMMENDED NOW: finish the current turn, commit any pending work, then /clear and start fresh.

Seed written to: .claude/PENDING_NEXT_SESSION.md

Paste this into the new session:

Read .claude/PENDING_NEXT_SESSION.md, STAGE.md, and docs/WORKFLOW.md. Resume from where session ${short_sess} stopped — run /stage-next per the current step."
    [[ -x "$notifier" ]] && CLAUDE_PROJECT_DIR="$cwd" "$notifier" --message "$text" >/dev/null 2>&1 || true

    # Inject a warning into the model's view via stdout (UserPromptSubmit
    # stdout is appended to the user's prompt so the main agent self-regulates).
    cat <<MODELHINT
[CONTEXT WARNING — ${pct}% of ${WINDOW}-token window]

The session is approaching its context limit. Before the next heavy
operation, do these in order:

1. Finish whatever you're about to do in ONE more turn.
2. Commit any pending work with a stage-boundary commit if applicable.
3. Emit a MANUAL_CHECKPOINT summarising state (open tasks, blockers, the
   step that was active) so the next session can pick up cleanly.
4. Tell the human: "context at ${pct}%, recommend /clear and resume via
   .claude/PENDING_NEXT_SESSION.md".

A seed file has been written at .claude/PENDING_NEXT_SESSION.md with a
suggested first prompt for the next session.
MODELHINT
    ;;
esac

# Record only after side-effects so a failed push does not dedupe.
echo "$key" >> "$cache"

exit 0
