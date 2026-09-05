#!/usr/bin/env bash
# Scaffold a new project from this stack template.
#
# Usage: scripts/scaffold.sh <target-dir> <project-slug>
#   <project-slug> must match: ^[a-z][a-z0-9-]*$  (kebab-case, used in package names)
#
# Copies the template into <target-dir>, replaces every __PROJECT_SLUG__
# occurrence (file contents) with <project-slug>, creates .env from
# .env.example, git-inits if needed and stages everything.
set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-}"
SLUG="${2:-}"

if [[ -z "$TARGET_DIR" || -z "$SLUG" ]]; then
  echo "Usage: scripts/scaffold.sh <target-dir> <project-slug>" >&2
  exit 1
fi
if [[ ! "$SLUG" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Error: slug '$SLUG' must be kebab-case: ^[a-z][a-z0-9-]*$" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
if [[ -e "$TARGET_DIR/package.json" ]]; then
  echo "Error: $TARGET_DIR already contains a package.json — refusing to overwrite." >&2
  exit 1
fi

echo "Copying template -> $TARGET_DIR"
# Exclude template metadata and anything install/build-generated.
rsync -a \
  --exclude 'node_modules' --exclude 'dist' --exclude '.next' --exclude 'coverage' \
  --exclude 'playwright-report' --exclude 'test-results' --exclude '.git' --exclude '*.tsbuildinfo' \
  --exclude 'pnpm-lock.yaml' --exclude 'scripts/scaffold.sh' --exclude 'TEMPLATE_VERSION' \
  "$TEMPLATE_DIR/" "$TARGET_DIR/"

echo "Renaming __PROJECT_SLUG__ -> $SLUG"
# BSD/GNU-portable in-place replace (template filenames contain no newlines/spaces).
{ grep -rl --exclude-dir=.git '__PROJECT_SLUG__' "$TARGET_DIR" 2>/dev/null || true; } |
  while IFS= read -r file; do
    perl -pi -e "s/__PROJECT_SLUG__/$SLUG/g" "$file"
  done
if grep -rq --exclude-dir=.git '__PROJECT_SLUG__' "$TARGET_DIR" 2>/dev/null; then
  echo "Error: placeholder rename incomplete — __PROJECT_SLUG__ still present." >&2
  exit 1
fi

if [[ ! -f "$TARGET_DIR/.env" ]]; then
  cp "$TARGET_DIR/.env.example" "$TARGET_DIR/.env"
  echo "Created .env from .env.example"
fi

cd "$TARGET_DIR"
# Probe with rev-parse, not `-d .git`: inside a git WORKTREE the target's .git
# is a pointer FILE, and a `git init` there would replace it with a fresh repo,
# disconnecting the worktree from its history and disarming core.hooksPath.
if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Target is already inside a git repo/worktree — skipping git init"
else
  git init -q
  echo "Initialized git repository"
fi
git add -A

cat <<EOF

Scaffolded '$SLUG' at $TARGET_DIR. Next:
  cd $TARGET_DIR
  pnpm install
  pnpm ui:sync                 # keo component UI tu registry reno-ui (CAN mang)
  docker compose up -d db && pnpm db:migrate && pnpm db:seed
  pnpm dev

UI: apps/web/src/components/ui/ do 'pnpm ui:sync' do day, khong viet tay vao do
(lan sync sau ghi de mat). Danh sach component o apps/web/reno-ui.manifest.json;
them thi 'pnpm ui:sync --add <ten>'. Thieu component thi nang o repo reno-ui goc.
Chua chay ui:sync thi 'pnpm build' se do vi khong co component nao.

Tip: on a slow network, pre-pull the base images early (they can take a while
and later block the db boot / prod-image build):
  docker pull pgvector/pgvector:pg16 & docker pull node:22-alpine &
EOF
