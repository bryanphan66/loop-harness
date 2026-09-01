#!/usr/bin/env bash
# wait-workers.sh — block until dispatched bg-worker(s) reach a DONE signal, then
# print a compact status. Replaces the ad-hoc poll loops a ctl session otherwise
# re-hand-rolls every dispatch (the #1 friction from the 2026-08-13/14 dogfood).
#
# The DONE signal per target is whichever comes first:
#   - a --branch's open PR is MERGEABLE (a bg session often lingers state=working
#     AFTER its PR is complete — so PR-ready, NOT worker-state, is the real signal), OR
#   - a --id worker reaches a terminal claude-agents state (done/blocked/stopped/error).
#
# Meant to run via `claude`'s run_in_background so the ctl session is re-invoked
# on exit (no foreground sleep, cache-friendly cadence).
#
# Usage:
#   wait-workers.sh --branch fix/foo [--branch feat/bar ...] [--id 1a2b3c4d ...] \
#                   [--timeout-min 60] [--interval 45]
#   env: none. Needs gh + (for --id) the `claude` CLI on PATH.
#
# Exit 0 = all targets ready. Exit 1 = timeout with some target not ready.
set -uo pipefail

BRANCHES=(); IDS=(); TIMEOUT_MIN=60; INTERVAL=45
while [ $# -gt 0 ]; do
  case "$1" in
    --branch) BRANCHES+=("$2"); shift 2;;
    --id)     IDS+=("$2"); shift 2;;
    --timeout-min) TIMEOUT_MIN="$2"; shift 2;;
    --interval)    INTERVAL="$2"; shift 2;;
    *) echo "wait-workers: unknown arg $1" >&2; exit 2;;
  esac
done
[ ${#BRANCHES[@]} -eq 0 ] && [ ${#IDS[@]} -eq 0 ] && { echo "usage: wait-workers.sh --branch <b> | --id <8char> [...]"; exit 2; }

total=$(( ${#BRANCHES[@]} + ${#IDS[@]} ))
iters=$(( TIMEOUT_MIN * 60 / INTERVAL )); [ "$iters" -lt 1 ] && iters=1

# terminal states for a claude bg session
term_state() { case "$1" in done|blocked|stopped|error) return 0;; *) return 1;; esac; }

branch_pr() { # echoes "<num>/<mergeable>" or "" — newest open PR for the head branch
  gh pr list --state open --search "head:$1" --json number,mergeable \
    --jq '.[0] | "\(.number)/\(.mergeable)"' 2>/dev/null
}

worker_state() { # echoes the claude-agents state for an 8-char id prefix, or "?"
  claude agents --json --all 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin); arr=d if isinstance(d,list) else d.get('sessions',d.get('agents',[]))
pref='$1'
print(next((a.get('state','?') for a in arr if a.get('id','')[:len(pref)]==pref), '?'))" 2>/dev/null
}

for i in $(seq 1 "$iters"); do
  ready=0; line=""
  for b in "${BRANCHES[@]:-}"; do
    [ -z "$b" ] && continue
    pr=$(branch_pr "$b")
    echo "$pr" | grep -q MERGEABLE && ready=$((ready+1))
    line="$line ${b##*/}:[${pr:-none}]"
  done
  for id in "${IDS[@]:-}"; do
    [ -z "$id" ] && continue
    st=$(worker_state "$id")
    term_state "$st" && ready=$((ready+1))
    line="$line $id:$st"
  done
  echo "[$i/$iters] $ready/$total ready |$line"
  [ "$ready" -eq "$total" ] && { echo "ALL_READY"; exit 0; }
  sleep "$INTERVAL"
done
echo "TIMEOUT ($TIMEOUT_MIN min) — $ready/$total ready"; exit 1
