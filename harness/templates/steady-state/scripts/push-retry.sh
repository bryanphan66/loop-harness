#!/usr/bin/env bash
# R2 recover (self-healing) — git push with bounded retry on a FLAKY gate failure.
#
# A pre-push verify gate that runs the full test suite can fail a push on a transient
# integration flake (a redis/queue timing race) that a clean pre-commit just passed.
# Retry ONLY on the flaky signature; a real/deterministic failure (rejected, network)
# fails immediately. Bounded: <=2 retries, then fail-closed (hand back to a human).
#
# Usage:  scripts/push-retry.sh [<git push args...>]
# Tune:   PUSH_RETRY_MAX (2) · PUSH_RETRY_FLAKY (regex of THIS project's transient flake)
# Dogfooded on elearning-platform; project-agnostic (set PUSH_RETRY_FLAKY per project).
set -uo pipefail

MAX="${PUSH_RETRY_MAX:-2}"
FLAKY="${PUSH_RETRY_FLAKY:-redis|BullMQ|queue|ECONNREFUSED|ETIMEDOUT|timed? out|ELIFECYCLE.*test}"

attempt=0
while :; do
  out="$(git push "$@" 2>&1)"; rc=$?
  printf '%s\n' "$out"
  [ "$rc" -eq 0 ] && exit 0

  if ! printf '%s' "$out" | grep -qiE "$FLAKY"; then
    echo "push-retry: not a flaky signature (likely a real failure: rejected/network/real-gate) -> NO retry." >&2
    exit "$rc"
  fi

  attempt=$((attempt + 1))
  if [ "$attempt" -gt "$MAX" ]; then
    echo "push-retry: still failing after $MAX flaky retries -> fail-closed. Inspect the integration test for real." >&2
    exit "$rc"
  fi
  echo "push-retry: flaky gate failure, retry $attempt/$MAX in 5s..." >&2
  sleep 5
done
