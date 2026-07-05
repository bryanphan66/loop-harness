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
  --exclude 'playwright-report' --exclude 'test-results' --exclude '.git' \
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
if [[ ! -d .git ]]; then
  git init -q
  echo "Initialized git repository"
fi
git add -A

cat <<EOF

Scaffolded '$SLUG' at $TARGET_DIR. Next:
  cd $TARGET_DIR
  pnpm install
  docker compose up -d db && pnpm db:migrate && pnpm db:seed
  pnpm dev
EOF
