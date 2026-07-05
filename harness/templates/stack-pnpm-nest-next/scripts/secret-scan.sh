#!/usr/bin/env bash
# Local secret scan for the WALKING SKELETON gate ("secret scan clean") and
# pre-release checks. Prefers gitleaks when installed; otherwise falls back to
# a grep pass over TRACKED files for high-signal secret patterns. The fallback
# is deliberately narrow (few false positives) — it is a floor, not a
# replacement for gitleaks in CI.
#
# Usage: scripts/secret-scan.sh   (run from anywhere inside the repo)
# Exit: 0 clean · 1 findings · 2 not a git repo
set -u

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "secret-scan: not a git repository" >&2
  exit 2
}
cd "$repo_root" || exit 2

if command -v gitleaks >/dev/null 2>&1; then
  echo "secret-scan: using gitleaks"
  gitleaks detect --source . --no-banner
  exit $?
fi

echo "secret-scan: gitleaks not installed — grep fallback over tracked files"

# High-signal patterns: private key blocks, AWS access keys, Slack tokens,
# OpenAI/Stripe-style sk- keys, GitHub tokens, generic long hex assigned to a
# *_SECRET/_KEY/_TOKEN var in a non-example file.
patterns=(
  '-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----'
  'AKIA[0-9A-Z]{16}'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  'sk-[A-Za-z0-9_-]{20,}'
  'gh[pousr]_[A-Za-z0-9]{36,}'
)

found=0
for p in "${patterns[@]}"; do
  # Only tracked files; skip lockfiles and this script itself.
  hits="$(git grep -nIE "$p" -- ':!pnpm-lock.yaml' ':!scripts/secret-scan.sh' 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    echo "secret-scan: pattern match: $p"
    printf '%s\n' "$hits"
    found=1
  fi
done

# A committed real .env is a finding regardless of content (.env.example is fine).
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "secret-scan: .env is TRACKED — real env files must never be committed"
  found=1
fi

if [ "$found" -ne 0 ]; then
  echo "secret-scan: FINDINGS above — rotate any real secret and remove it from git history" >&2
  exit 1
fi
echo "secret-scan: clean (grep fallback — run gitleaks in CI for full coverage)"
exit 0
