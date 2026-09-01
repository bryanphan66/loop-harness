#!/usr/bin/env bash
# notify.sh — Notification + Stop hook. Pushes "Claude needs attention" and
# MANUAL_CHECKPOINT alerts to the human via the channel-abstracted notifier
# (.claude/scripts/notifier-send.sh — Telegram by default, swappable).
#
# Behaviors:
# - Notification: includes the agent's last-assistant text snippet so the human
#   sees WHAT attention is needed (not just a generic "needs input").
# - Stop: if the last assistant turn contains a MANUAL_CHECKPOINT block, posts
#   the block AND auto-attaches any repo-relative reference files it names
#   (docs/**, plans/**, scripts/**, tests/**) — so the prototype URL / scope
#   review / UAT walkthrough arrives with its reference material already pushed.
#   This is the client-paging surface for PB-G2, PB-G3, PB-G4, ACCEPTANCE,
#   HANDOVER (see AGENTS.md § Manual Checkpoint Signaling).
#
# Never blocks Claude Code: every failure path exits 0.

set -uo pipefail
trap 'exit 0' ERR

# Auto-load .claude/.env (shell-exported vars still win).
env_file="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
fi

payload=$(cat)
event=$(printf '%s' "$payload" | jq -r '.hook_event_name // "unknown"')
cwd=$(printf '%s' "$payload" | jq -r '.cwd // ""')
[[ -z "$cwd" || ! -d "$cwd" ]] && cwd="${CLAUDE_PROJECT_DIR:-$(pwd)}"
session=$(printf '%s' "$payload" | jq -r '.session_id // "?"' | cut -c1-8)
tpath=$(printf '%s' "$payload" | jq -r '.transcript_path // ""')
host=$(hostname -s 2>/dev/null || echo "host")

notifier="${cwd}/.claude/scripts/notifier-send.sh"
[[ -x "$notifier" ]] || exit 0

# Concatenated text content of the most recent assistant turn ("" if none).
last_assistant_text() {
  local _tp="$1" _json
  [[ -n "$_tp" && -f "$_tp" ]] || return 0
  _json=$(tac "$_tp" 2>/dev/null | while IFS= read -r ln; do
    if printf '%s' "$ln" | jq -e '.type=="assistant"' >/dev/null 2>&1; then
      printf '%s' "$ln"
      break
    fi
  done)
  [[ -n "$_json" ]] || return 0
  printf '%s' "$_json" \
    | jq -r '.message.content // [] | map(select(.type=="text") | .text) | join("\n\n")' 2>/dev/null
}

# Repo-relative reference paths in a blob that exist on disk; dedupe, cap at $3.
extract_referenced_files() {
  local _text="$1" _cwd="$2" _max="${3:-12}"
  local _re='(docs|plans|scripts|tests?|src|app|public|assets)/[A-Za-z0-9._/-]+\.(md|txt|json|yaml|yml|toml|pdf|png|jpe?g|gif|svg|webp|html|csv|tsv|xlsx|docx|mp4|webm|zip|tar\.gz)'
  printf '%s\n' "$_text" \
    | grep -oE "$_re" \
    | awk '!seen[$0]++' \
    | head -n "$_max" \
    | while IFS= read -r p; do
        [[ -f "${_cwd}/${p}" ]] && printf '%s\n' "$p"
      done
}

last_full=""
manual_block=""
text=""

case "$event" in
  Notification)
    msg=$(printf '%s' "$payload" | jq -r '.message // "(no message)"')
    last_full=$(last_assistant_text "$tpath")
    last_snip=""
    [[ -n "$last_full" ]] && last_snip=$(printf '%s' "$last_full" | head -c 700 | sed -e 's/[[:space:]]*$//')
    text="[Claude] needs attention: ${msg}
host: ${host}
session: ${session}
dir: ${cwd}"
    if [[ -n "$last_snip" ]]; then
      text="${text}

— what attention is needed (last assistant turn, trimmed):
${last_snip}"
    fi
    ;;

  Stop)
    last_full=$(last_assistant_text "$tpath")
    if [[ -n "$last_full" ]] && printf '%s' "$last_full" | grep -q 'MANUAL_CHECKPOINT'; then
      manual_block=$(printf '%s' "$last_full" | awk '/MANUAL_CHECKPOINT/{p=1} p{print}' | head -c 3500)
      text="[MANUAL CHECKPOINT] Claude is waiting on offline work
host: ${host}
session: ${session}
dir: ${cwd}

${manual_block}"
    else
      last_line=$(printf '%s' "$last_full" | head -n 1 | cut -c1-300)
      text="[Claude] turn finished
host: ${host}
session: ${session}
dir: ${cwd}"
      [[ -n "$last_line" ]] && text="${text}

last: ${last_line}"
    fi
    ;;

  *)
    text="[Claude] event: ${event}
host: ${host}
session: ${session}
dir: ${cwd}"
    ;;
esac

CLAUDE_PROJECT_DIR="$cwd" "$notifier" --message "$text" >/dev/null 2>&1 || true

# Stop-event auto-attach: push reference files the MANUAL_CHECKPOINT named.
if [[ "$event" == "Stop" && -n "$manual_block" ]]; then
  mapfile -t refs < <(extract_referenced_files "$manual_block" "$cwd" 12)
  if (( ${#refs[@]} > 0 )); then
    abs_refs=()
    for r in "${refs[@]}"; do
      abs_refs+=("${cwd}/${r}")
    done
    CLAUDE_PROJECT_DIR="$cwd" "$notifier" \
      --caption "[MANUAL CHECKPOINT refs] ${#refs[@]} file(s) referenced above" \
      "${abs_refs[@]}" >/dev/null 2>&1 || true
  fi
fi

exit 0
