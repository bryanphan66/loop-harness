#!/usr/bin/env bash
# R3 recover (self-healing) — after a merge, verify the deploy actually reached the
# target AT SOURCE (the running artifact carries the shipped commit). On mismatch:
# re-trigger the deploy ONCE; still wrong -> open a deploy-drift follow-up issue and
# fail-closed. Never trust a green CI run / HTTP 200 (verify-at-source).
#
# Usage: scripts/ship-and-verify.sh <issue-number> [<commit-sha>]
#
# Config (git config deploy.*, matching the RENO deploy standard):
#   deploy.branch        integration branch that deploys        (default: repo default branch)
#   deploy.workflow      the deploy workflow file               (default: deploy-staging.yml)
#   Verify-at-source, pick ONE:
#     deploy.healthUrl     an endpoint whose body contains the running commit/version
#     deploy.healthGrep    (optional) extra regex the health body must match beside the sha
#   OR
#     deploy.sshTarget     user@host of the box                 (+ deploy.sshPort, default 22)
#     deploy.containerGrep grep -oE pattern that yields the running artifact's 40-hex git sha
set -uo pipefail

ISSUE="${1:?usage: ship-and-verify.sh <issue-number> [<commit-sha>]}"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
DEFBR="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo main)"
cfg() { git config --get "deploy.$1" 2>/dev/null || true; }

BRANCH="${DEPLOY_BRANCH:-$(cfg branch)}"; BRANCH="${BRANCH:-$DEFBR}"
WORKFLOW="${DEPLOY_WORKFLOW:-$(cfg workflow)}"; WORKFLOW="${WORKFLOW:-deploy-staging.yml}"
COMMIT="${2:-$(gh api "repos/$REPO/commits/$BRANCH" --jq '.sha')}"
SHORT="${COMMIT:0:7}"

HEALTH="$(cfg healthUrl)"; HGREP="$(cfg healthGrep)"
SSH_T="$(cfg sshTarget)"; SSH_P="$(cfg sshPort)"; SSH_P="${SSH_P:-22}"; CGREP="$(cfg containerGrep)"

poll_deploy() {
  local i st cc rid
  for i in $(seq 1 40); do
    read -r rid st cc < <(gh run list --repo "$REPO" --branch "$BRANCH" --workflow "$WORKFLOW" --limit 1 \
      --json databaseId,status,conclusion --jq '.[]|"\(.databaseId) \(.status) \(.conclusion)"' 2>/dev/null)
    [ "$st" = completed ] && { echo "deploy run $rid -> $cc" >&2; return 0; }
    sleep 30
  done
  echo "deploy poll timeout" >&2; return 1
}

verify() { # verify-at-source: true iff the running artifact carries $SHORT
  if [ -n "$HEALTH" ]; then
    local body; body="$(curl -s --max-time 15 "$HEALTH" 2>/dev/null)"
    printf '%s' "$body" | grep -q "$SHORT" || return 1
    [ -z "$HGREP" ] || printf '%s' "$body" | grep -qE "$HGREP"
  elif [ -n "$SSH_T" ] && [ -n "$CGREP" ]; then
    local c; c="$(timeout 25 ssh -p "$SSH_P" -o StrictHostKeyChecking=no -o ConnectTimeout=12 "$SSH_T" \
      "docker ps --format '{{.Names}}' | grep -oE '$CGREP' | head -1" 2>/dev/null | grep -oE '[a-f0-9]{40}')"
    echo "  container=${c:0:7} want=$SHORT" >&2; [ "${c:0:7}" = "$SHORT" ]
  else
    echo "ship-and-verify: configure deploy.healthUrl OR deploy.sshTarget+deploy.containerGrep" >&2; exit 2
  fi
}

echo "R3: wait deploy $BRANCH -> verify target == $SHORT"
poll_deploy || true
if verify; then echo "OK: target is running $SHORT"; exit 0; fi

echo "R3 recover: target != $SHORT -> re-trigger deploy once"
gh workflow run "$WORKFLOW" --repo "$REPO" --ref "$BRANCH" 2>/dev/null \
  || gh run rerun "$(gh run list --repo "$REPO" --branch "$BRANCH" --workflow "$WORKFLOW" --limit 1 --json databaseId --jq '.[0].databaseId')" 2>/dev/null \
  || echo "  (could not re-trigger — workflow lacks dispatch/rerun)" >&2
poll_deploy || true
if verify; then echo "OK after re-trigger: target is running $SHORT"; exit 0; fi

echo "R3 fail-closed: still drifted after re-trigger -> open deploy-drift issue"
url="$(gh issue create --repo "$REPO" \
  --title "Deploy-drift: target not on $SHORT (from issue #$ISSUE)" \
  --body "R3 recover fail-closed: after merge + one re-trigger, the running artifact still differs from commit \`$COMMIT\`. Check the deploy workflow / runner / target box. Verify-at-source config: deploy.healthUrl or deploy.sshTarget+deploy.containerGrep. Refs #$ISSUE." 2>&1 | grep -oE 'https://[^ ]+/issues/[0-9]+' | tail -1)"
echo "  opened: ${url:-<issue create failed, check gh auth>}"
exit 1
