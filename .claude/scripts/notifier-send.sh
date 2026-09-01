#!/usr/bin/env bash
# notifier-send.sh — channel-abstracted notifier for the harness hooks.
#
# This is a THIN INTERFACE so the harness is not bound to one push channel.
# Hooks call this script; this script dispatches to a concrete channel driver.
# Default channel: telegram. Swap via NOTIFIER_CHANNEL in .claude/.env.
#
# Usage (identical surface for every channel):
#   notifier-send.sh --message "text only, no files"
#   notifier-send.sh [--caption "text"] file1 [file2 ...]
#   notifier-send.sh --channel telegram --message "..."     # one-off override
#
# Channel selection (first wins):
#   1. --channel <name> flag
#   2. NOTIFIER_CHANNEL env (from shell or .claude/.env)
#   3. default: telegram
#
# Adding a channel = add a `send_<channel>` function below and a case arm.
# The contract every driver honors:
#   - text-only:   $MESSAGE set, ${#files[@]} == 0  -> send a message
#   - files:       ${#files[@]} > 0                  -> send each file
#                  $CAPTION applies to the FIRST file; $MESSAGE (if also set)
#                  is sent as a preface message before the files
#   - missing creds -> WARN to stderr, exit 0 (never crash a hook)
#
# Env (read from .claude/.env or the shell):
#   NOTIFIER_CHANNEL        default: telegram
#   TELEGRAM_BOT_TOKEN      telegram driver
#   TELEGRAM_CHAT_ID        telegram driver
#   TELEGRAM_NOTIFY_SILENT  1 = silent push (no sound). default 0
#   TELEGRAM_SEND_DELAY     seconds between file sends. default 0.4
#   NOTIFIER_FILE_LIMIT     per-file byte cap. default 52428800 (50 MB)

set -uo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
CAPTION=""
MESSAGE=""
OVERRIDE_CHANNEL=""
OVERRIDE_CHAT_ID=""
files=()

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [file ...]

Options:
  -c, --caption TEXT     Caption applied to the FIRST file only.
  -m, --message TEXT     Send a text-only message (no files needed).
      --channel NAME     Override NOTIFIER_CHANNEL for this call (e.g. telegram).
      --chat-id ID       Telegram only: override TELEGRAM_CHAT_ID for this call.
  -h, --help             Show this help.

Examples:
  $(basename "$0") --message "Stage boundary reached"
  $(basename "$0") --caption "Scope frozen — feature register" docs/scope-baseline/feature-register.md
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--caption) CAPTION="${2:-}"; shift 2 ;;
    -m|--message) MESSAGE="${2:-}"; shift 2 ;;
    --channel)    OVERRIDE_CHANNEL="${2:-}"; shift 2 ;;
    --chat-id)    OVERRIDE_CHAT_ID="${2:-}"; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    --)           shift; while [[ $# -gt 0 ]]; do files+=("$1"); shift; done ;;
    -*)           echo "notifier-send: unknown option: $1" >&2; usage >&2; exit 2 ;;
    *)            files+=("$1"); shift ;;
  esac
done

# ---------------------------------------------------------------------------
# Load shared env (.claude/.env). Shell-exported vars win (set -a only assigns
# names not already exported).
# ---------------------------------------------------------------------------
env_file="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
fi

CHANNEL="${OVERRIDE_CHANNEL:-${NOTIFIER_CHANNEL:-telegram}}"
FILE_LIMIT="${NOTIFIER_FILE_LIMIT:-$((50 * 1024 * 1024))}"

# Nothing to send guard.
if [[ -z "$MESSAGE" && ${#files[@]} -eq 0 ]]; then
  echo "notifier-send: nothing to send (no --message and no files)" >&2
  usage >&2
  exit 2
fi

# ===========================================================================
# Channel driver: telegram
# ===========================================================================
send_telegram() {
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
    echo "notifier-send[telegram]: TELEGRAM_BOT_TOKEN not set (check .claude/.env) — skipping push" >&2
    return 0
  fi
  local chat_id="${OVERRIDE_CHAT_ID:-${TELEGRAM_CHAT_ID:-}}"
  if [[ -z "$chat_id" ]]; then
    echo "notifier-send[telegram]: TELEGRAM_CHAT_ID not set (check .claude/.env) — skipping push" >&2
    return 0
  fi

  local api="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"
  local disable_notif="false"
  [[ "${TELEGRAM_NOTIFY_SILENT:-0}" == "1" ]] && disable_notif="true"

  # Text-only mode.
  if [[ -n "$MESSAGE" && ${#files[@]} -eq 0 ]]; then
    curl -sS -m 15 -X POST "${api}/sendMessage" \
      --data-urlencode "chat_id=${chat_id}" \
      --data-urlencode "text=${MESSAGE}" \
      --data-urlencode "disable_notification=${disable_notif}" >/dev/null 2>&1 || true
    return 0
  fi

  # Optional preface message alongside files.
  if [[ -n "$MESSAGE" ]]; then
    curl -sS -m 15 -X POST "${api}/sendMessage" \
      --data-urlencode "chat_id=${chat_id}" \
      --data-urlencode "text=${MESSAGE}" \
      --data-urlencode "disable_notification=${disable_notif}" >/dev/null 2>&1 || true
  fi

  local send_delay="${TELEGRAM_SEND_DELAY:-0.4}"
  local first=1 i=0 f size

  for f in "${files[@]}"; do
    i=$((i + 1))
    if [[ ! -f "$f" ]]; then
      echo "notifier-send[telegram]: skip (not a file): $f" >&2
      continue
    fi
    size=$(stat -c %s "$f" 2>/dev/null || stat -f %z "$f" 2>/dev/null || echo 0)
    if (( size > FILE_LIMIT )); then
      echo "notifier-send[telegram]: skip (> ${FILE_LIMIT} byte cap, size=${size}): $f" >&2
      continue
    fi

    local cap_args=()
    if [[ $first -eq 1 && -n "$CAPTION" ]]; then
      cap_args=(-F "caption=${CAPTION}")
      first=0
    fi

    curl -sS -m 300 -X POST "${api}/sendDocument" \
      -F "chat_id=${chat_id}" \
      -F "disable_notification=${disable_notif}" \
      "${cap_args[@]}" \
      -F "document=@${f}" >/dev/null 2>&1 || true

    if (( i < ${#files[@]} )); then
      sleep "$send_delay" 2>/dev/null || true
    fi
  done
  return 0
}

# ===========================================================================
# Channel driver: noop (explicit "send nowhere" — useful in CI / dev)
# ===========================================================================
send_noop() {
  echo "notifier-send[noop]: channel disabled — would have sent: ${MESSAGE:-(files: ${#files[@]})}" >&2
  return 0
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
case "$CHANNEL" in
  telegram) send_telegram ;;
  noop|none|off) send_noop ;;
  *)
    echo "notifier-send: unknown NOTIFIER_CHANNEL='${CHANNEL}' — no driver. Add send_${CHANNEL}() to swap in a channel. Skipping." >&2
    exit 0
    ;;
esac

exit 0
