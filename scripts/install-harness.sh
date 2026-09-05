#!/usr/bin/env bash
# install-harness.sh — one-command bootstrap of the loop-harness skeleton
# into a NEW (or existing) project directory.
#
# What it does (see AGENTS.md + docs/about/HARNESS.md for the operating model):
#   - Copies the harness skeleton: AGENTS.md + STAGE.md template + docs/ +
#     .claude/ + .githooks/ + scripts/ (only the skeleton paths — never the
#     source repo's own plans/, .git/, or design scratch).
#   - Embeds the stack template (scaffolds/stack-pnpm-nest-next/) into
#     <target>/.harness/stack-template/ — source only, no node_modules/dist/
#     .turbo/.next/pnpm-lock.yaml — so WORKFLOW step 2.4 always has a reachable,
#     proven scaffold to run instead of a project hand-deriving an equivalent.
#     `.harness/` is harness-owned: every (re)install wipes and recopies it
#     wholesale (no stale TEMPLATE_VERSION lingers), and ".harness/" is appended
#     to the target's .gitignore so the embed never lands in the project's repo.
#   - PREFLIGHT-CHECKS that ~/.claude/skills + ~/.claude/agents exist and WARNS
#     if missing (Independence Principle, decision D1/D6). It NEVER copies or
#     vendors the ck-* skills/agents — they are the live engine, not a payload.
#   - `git init` only if it created .git; sets core.hooksPath=.githooks so the
#     verify gate is active.
#   - Copies docs/mau-tai-lieu/STAGE.md to the project root STAGE.md and fills the
#     Snapshot section for a fresh project.
#   - Writes .claude/settings.local.json (gitignored) with the notifier hooks
#     pre-registered.
#   - Auto-commits the bootstrap baseline ONLY when it created .git (so an
#     existing repo's history is never touched).
#   - Prints the first /goal to paste into Claude Code.
#
# --bootstrap --spec <file|dir> (repeatable) drops raw inputs into
# docs/discovery/YYYY-MM-DD-<slug>.<ext> (VN diacritics ASCII-folded).
#
# Clean POSIX-leaning bash. No network needed in local mode (the common case:
# run from a clone of the harness repo, where the skeleton lives under
# the repo root). Remote mode (no local clone found) fetches the repo as a tarball
# into a temp dir, then installs with the same copy logic — so you do NOT need
# the harness checked out locally; set HARNESS_REPO (owner/repo). Private repos are
# fetched via `gh` (or a GitHub token in GH_TOKEN/GITHUB_TOKEN); public repos
# fall back to an anonymous tarball. Override the source with HARNESS_REPO
# (owner/repo) and HARNESS_REF (branch/tag/sha).

set -euo pipefail

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------
usage() {
  cat <<'EOF'
Usage: install-harness.sh [options] [path]

Bootstrap the loop-harness skeleton into a target project directory.

Options:
  -d, --directory <path>  Target directory. Defaults to the current directory.
  -y, --yes               Accept defaults and skip prompts.
      --bootstrap         Greenfield bootstrap: git init (if needed) +
                          force-copy the harness skeleton (no merge prompts) +
                          fill STAGE.md Snapshot + write settings.local.json +
                          auto-commit the baseline (ONLY when the installer
                          created .git itself). Combine with --spec to drop raw
                          inputs into docs/discovery/.
                          REQUIRES an explicit target dir — bootstrap is
                          destructive (override+force) and refuses to default to
                          the current directory, $HOME, or a global ~/.claude.
      --spec <path>       With --bootstrap, copy spec input(s) into
                          docs/discovery/. <path> is a single file OR a
                          directory of input files. Repeatable to mix several
                          files/directories. One file lands as
                          YYYY-MM-DD-initial-spec.<ext>; multiple resolved files
                          each land as YYYY-MM-DD-<kebab-slug>.<ext> (VN
                          diacritics ASCII-folded).
      --merge             On protected-path conflict, keep existing files and
                          install only missing harness files.
      --override          On protected-path conflict, back up and replace
                          AGENTS.md, docs/, scripts/, .claude/.
      --force             Overwrite existing files after backing them up.
      --dry-run           Show what would change without writing files.
  -h, --help              Show this help.

Safety:
  If AGENTS.md, docs/, scripts/, or .claude/ already exist, interactive installs
  ask whether to merge missing files, override after backup, or stop. Non-
  interactive installs stop unless --merge or --override is given. --bootstrap
  implies --override (with backups) and accepts the protected-path warning.

Preflight (Independence Principle, decision D1/D6):
  The installer checks that ~/.claude/skills and ~/.claude/agents exist and
  WARNS (non-fatal) if missing. The ck-* skills are the live engine the harness
  invokes — they are NEVER copied/vendored into the project. The harness still
  runs on a bare agent + git + bash; ck-skills are accelerators, not deps.

Remote (no local clone — fetches the repo as a tarball into a temp dir).
  HARNESS_REPO (owner/repo) is REQUIRED in remote mode; there is no default:
    gh api repos/<owner>/<repo>/contents/scripts/install-harness.sh \
      -H "Accept: application/vnd.github.raw" \
      | HARNESS_REPO=<owner>/<repo> bash -s -- --bootstrap ./my-new-project
    curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/install-harness.sh \
      | HARNESS_REPO=<owner>/<repo> bash -s -- --bootstrap ./my-new-project
  Pin a branch/tag with HARNESS_REF (default: main).

Examples:
  scripts/install-harness.sh --bootstrap ./my-new-project
  scripts/install-harness.sh --bootstrap --spec ./brd.md ./my-new-project
  scripts/install-harness.sh --bootstrap --spec ./inbox/ --spec notes.md ./proj
  scripts/install-harness.sh --directory /path/to/existing --merge --yes
  scripts/install-harness.sh --dry-run --bootstrap ./preview
EOF
}

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
log()  { printf '%s\n' "$*"; }
fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }
warn() { printf 'Warning: %s\n' "$*" >&2; }
warn_stop() { printf 'Warning: %s\n' "$*" >&2; exit 1; }

can_prompt() { [ -r /dev/tty ] && [ -w /dev/tty ]; }
prompt_tty() { printf '%s' "$1" > /dev/tty; }
read_tty() { local v; IFS= read -r v < /dev/tty; printf '%s\n' "$v"; }

# Fold a filename stem to a grep-friendly kebab slug. iconv//TRANSLIT folds VN
# diacritics (and other accents) to ASCII so docs/discovery/ slugs stay portable
# for LLM tools (Grep/Glob); falls back to the raw stem if iconv is absent.
slugify() {
  local name="$1" slug=""
  if command -v iconv >/dev/null 2>&1; then
    slug="$(printf '%s' "$name" | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null || printf '%s' "$name")"
  else
    slug="$name"
  fi
  slug="$(printf '%s' "$slug" | tr '[:upper:]' '[:lower:]')"
  slug="$(printf '%s' "$slug" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  printf '%s' "$slug"
}

expand_path() {
  case "$1" in
    "~")    printf '%s\n' "$HOME" ;;
    "~/"*)  printf '%s/%s\n' "$HOME" "${1#~/}" ;;
    /*)     printf '%s\n' "$1" ;;
    *)      printf '%s/%s\n' "$PWD" "$1" ;;
  esac
}

make_absolute_parent() {
  local path="$1" parent
  parent="$(dirname "$path")"
  [ -d "$parent" ] || fail "Parent directory does not exist: $parent"
  (cd "$parent" && printf '%s/%s\n' "$(pwd -P)" "$(basename "$path")")
}

# ---------------------------------------------------------------------------
# Preflight: ck-skills + global agents (decision D1/D6 — preflight, not vendor)
# ---------------------------------------------------------------------------
# The harness invokes these as the live engine. They live in the user's global
# ~/.claude — NOT in the project. We check presence and warn the human which
# accelerators are missing, but we NEVER copy them. The harness stays runnable
# on a bare agent without them (Independence Principle).
EXPECTED_SKILLS="ck-intake-file ck-rri ck-xre ck-scenario ck-scope-package ck-brand-guidelines ck-design-system ck-ux-design ck-tech-design ck-plan ck-predict ck-code-review ck-security ck-seed ck-e2e-flow ck-qa ck-uat ck-signoff ck-prod-readiness ck-handover ck-hypercare ck-client-update"
EXPECTED_AGENTS="planner researcher fullstack-developer code-reviewer tester debugger ui-ux-designer docs-manager project-manager git-manager code-simplifier journal-writer brainstormer"

preflight_check_engine() {
  local skills_dir="$HOME/.claude/skills"
  local agents_dir="$HOME/.claude/agents"
  local missing=0

  log "Preflight — ck-* engine (live skills, never vendored):"

  if [ -d "$skills_dir" ]; then
    log "  [skills] found: $skills_dir"
    local miss="" s
    for s in $EXPECTED_SKILLS; do
      # A skill is present if a dir or a *.md/SKILL exists under the name.
      if [ ! -e "$skills_dir/$s" ] && [ ! -e "$skills_dir/$s.md" ]; then
        miss="$miss $s"
      fi
    done
    if [ -n "$miss" ]; then
      warn "expected ck-skills not found under $skills_dir:$miss"
      warn "  these are accelerators — the harness still runs without them, but"
      warn "  the corresponding WORKFLOW steps fall back to a plain agent."
    fi
  else
    warn "~/.claude/skills missing — the ck-* engine is not installed."
    warn "  the harness runs on a bare agent + git + bash, but WORKFLOW steps"
    warn "  will not have their fast-path skills. Install ClaudeKit to enable them."
    missing=1
  fi

  if [ -d "$agents_dir" ]; then
    log "  [agents] found: $agents_dir"
    local miss="" a
    for a in $EXPECTED_AGENTS; do
      if [ ! -e "$agents_dir/$a" ] && [ ! -e "$agents_dir/$a.md" ]; then
        miss="$miss $a"
      fi
    done
    if [ -n "$miss" ]; then
      warn "expected global agents not found under $agents_dir:$miss"
      warn "  role players fall back to inline execution by the main agent."
    fi
  else
    warn "~/.claude/agents missing — global role-player agents are not installed."
    warn "  stage orchestration falls back to inline work by the main agent."
    missing=1
  fi

  if [ "$missing" -eq 0 ]; then
    log "  preflight: engine present (or only optional skills missing) — continuing."
  else
    log "  preflight: engine partly/entirely missing — continuing anyway (non-fatal)."
  fi
  log ""
}

# ---------------------------------------------------------------------------
# Skeleton copy
# ---------------------------------------------------------------------------
# The harness skeleton is discovered from the source root rather than a static
# manifest: we copy the curated top-level skeleton entries that EXIST in the
# source, recursively, skipping the source repo's own scratch (.git/, plans/,
# .harness-design/) and any private .claude/ runtime files. This keeps the
# installer robust while sibling artifacts are still being built, and avoids
# shipping the harness author's local state into a client project.
#
# SKELETON_PATHS: top-level paths to mirror (file or directory). Missing ones
# are silently skipped (logged in dry-run).
SKELETON_PATHS="AGENTS.md docs .claude .githooks scripts/harness-verify-gate.sh scripts/install-harness.sh scripts/README.md"

# Paths NEVER copied even if present under a skeleton dir (private/runtime).
# Matched as path suffix anchored at the skeleton root.
is_excluded_relpath() {
  case "$1" in
    .claude/.env|.claude/settings.local.json|.claude/.qa-telegram-sent|.claude/.context-warned|.claude/PENDING_NEXT_SESSION.md)
      return 0 ;;
    *) return 1 ;;
  esac
}

# Emit the flat list of relative files to copy (NUL-safe not needed: harness
# paths are ASCII). Walks each SKELETON_PATH; for dirs, finds regular files.
collect_skeleton_files() {
  local p
  for p in $SKELETON_PATHS; do
    if [ -f "$SOURCE_ROOT/$p" ]; then
      printf '%s\n' "$p"
    elif [ -d "$SOURCE_ROOT/$p" ]; then
      ( cd "$SOURCE_ROOT" && find "$p" -type f \
          ! -path '*/.git/*' \
          ! -name '.qa-telegram-sent' \
          ! -name '.context-warned' \
          ! -name 'PENDING_NEXT_SESSION.md' \
          | sort )
    fi
  done
}

copy_file() {
  local relative="$1"
  local target="$TARGET_DIR/$relative"

  if is_excluded_relpath "$relative"; then
    return
  fi

  if [ -e "$target" ]; then
    if [ "$SOURCE_ROOT/$relative" -ef "$target" ] 2>/dev/null; then
      log "skip     $relative (source == target)"; SKIPPED=$((SKIPPED + 1)); return
    fi
    if [ "$CONFLICT_ACTION" = "merge" ]; then
      log "skip     $relative (merge keeps existing)"; SKIPPED=$((SKIPPED + 1))
    elif [ "$FORCE" -eq 1 ]; then
      if [ "$DRY_RUN" -eq 1 ]; then
        log "overwrite $relative (backup first)"
      else
        local backup="$BACKUP_DIR/$relative"
        mkdir -p "$(dirname "$backup")"
        cp -p "$target" "$backup"
        write_source_file "$relative" "$target"
        log "updated  $relative (backup: ${backup#"$TARGET_DIR"/})"
      fi
      UPDATED=$((UPDATED + 1))
    else
      log "skip     $relative (already exists)"; SKIPPED=$((SKIPPED + 1))
    fi
    return
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    log "create   $relative"
  else
    mkdir -p "$(dirname "$target")"
    write_source_file "$relative" "$target"
    log "created  $relative"
  fi
  CREATED=$((CREATED + 1))
}

write_source_file() {
  local relative="$1" target="$2"
  if [ "$SOURCE_MODE" = "local" ]; then
    local source="$SOURCE_ROOT/$relative"
    [ -f "$source" ] || fail "Source file missing: $source"
    cp -p "$source" "$target"
    return
  fi
  local url="$SOURCE_BASE_URL/$relative"
  curl -fsSL "$url" -o "$target" || fail "Could not download $url"
}

# ---------------------------------------------------------------------------
# Stack template embed (closes the "template unreachable at scaffold time"
# gap: WORKFLOW step 2.4 expects the stack template "from the harness source"
# but a project with no local harness clone — or a stale HARNESS_REPO env —
# had no reachable copy at scaffold time, so the build agent hand-built an
# equivalent scaffold instead of reusing the shipped, red-teamed
# packages/queue-core / packages/storage-core. Embedding a source-only copy
# under <target>/.harness/stack-template/ at install time removes that gap.
# .harness/ is entirely harness-owned — nothing project-authored is ever
# expected there — so every (re)install wipes and recopies it wholesale.
# ---------------------------------------------------------------------------
STACK_TEMPLATE_RELDIR="scaffolds/stack-pnpm-nest-next"
STACK_TEMPLATE_TARGET_RELDIR=".harness/stack-template"
STACK_TEMPLATE_EMBEDDED=0
STACK_TEMPLATE_VERSION="unversioned"

# Flat relative-file list of the stack template, source only: excludes
# install/build-generated trees (node_modules, dist, .turbo, .next) and the
# lockfile (regenerated by the scaffolded project's own `pnpm install`).
collect_stack_template_files() {
  [ -d "$SOURCE_ROOT/$STACK_TEMPLATE_RELDIR" ] || return 0
  ( cd "$SOURCE_ROOT/$STACK_TEMPLATE_RELDIR" && find . -type f \
      ! -path '*/node_modules/*' \
      ! -path '*/dist/*' \
      ! -path '*/.turbo/*' \
      ! -path '*/.next/*' \
      ! -name 'pnpm-lock.yaml' \
      | sed 's|^\./||' | sort )
}

copy_stack_template() {
  if [ ! -d "$SOURCE_ROOT/$STACK_TEMPLATE_RELDIR" ]; then
    warn "stack template not found at $SOURCE_ROOT/$STACK_TEMPLATE_RELDIR — skipping embed (step 2.4 scaffold falls back to the harness-source clone/tarball)."
    return 0
  fi

  local dest_root="$TARGET_DIR/$STACK_TEMPLATE_TARGET_RELDIR"
  local count=0 relative target

  if [ -f "$SOURCE_ROOT/$STACK_TEMPLATE_RELDIR/TEMPLATE_VERSION" ]; then
    # TEMPLATE_VERSION is free-text (changelog-style); pull the `version: X`
    # line rather than the first line (which is a human-readable title, not
    # a version number).
    STACK_TEMPLATE_VERSION="$(awk -F': *' '/^version:/{print $2; exit}' \
      "$SOURCE_ROOT/$STACK_TEMPLATE_RELDIR/TEMPLATE_VERSION" 2>/dev/null || true)"
    [ -n "$STACK_TEMPLATE_VERSION" ] || STACK_TEMPLATE_VERSION="unversioned"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    log "Stack template -> $STACK_TEMPLATE_TARGET_RELDIR/ (source only — node_modules/dist/.turbo/.next/pnpm-lock.yaml excluded):"
    while IFS= read -r relative; do
      [ -n "$relative" ] || continue
      log "  embed    $STACK_TEMPLATE_TARGET_RELDIR/$relative"
      count=$((count + 1))
    done < <(collect_stack_template_files)
    log "Stack template (dry-run): $count files would be embedded, TEMPLATE_VERSION $STACK_TEMPLATE_VERSION."
    return 0
  fi

  # .harness/ is harness-owned: wipe any previous embed first so a stale
  # TEMPLATE_VERSION (or a file removed upstream) never lingers after upgrade.
  rm -rf "$dest_root"
  mkdir -p "$dest_root"
  while IFS= read -r relative; do
    [ -n "$relative" ] || continue
    target="$dest_root/$relative"
    mkdir -p "$(dirname "$target")"
    cp -p "$SOURCE_ROOT/$STACK_TEMPLATE_RELDIR/$relative" "$target"
    log "embedded $STACK_TEMPLATE_TARGET_RELDIR/$relative"
    count=$((count + 1))
  done < <(collect_stack_template_files)
  chmod +x "$dest_root/scripts/"*.sh 2>/dev/null || true

  STACK_TEMPLATE_EMBEDDED=1
  log ""
  log "Stack template embedded: $STACK_TEMPLATE_TARGET_RELDIR/ ($count files, TEMPLATE_VERSION $STACK_TEMPLATE_VERSION)"
  log "  scaffold (step 2.4 primary path): $STACK_TEMPLATE_TARGET_RELDIR/scripts/scaffold.sh <target-dir> <project-slug>"
}

# ---------------------------------------------------------------------------
# Steady-state kit embed
# ---------------------------------------------------------------------------
# macro-2 step 2.13 calls scripts/ship-and-verify.sh, and the issue-pipeline
# (Mode B) calls new-issue.mjs / issue-state.mjs / qc-checklist.mjs. All of them
# live in scaffolds/steady-state/, which this installer did NOT embed until
# 2026-09-05 — so every project it installed named those five scripts in its
# workflow and shipped with none of them, silently. Found on autocontent
# (loop-harness docs/process/macro-2-deltas.md MD-06).
# Same ownership rule as the stack template: .harness/ is harness-owned and
# wiped wholesale on every (re)install.
STEADY_KIT_RELDIR="scaffolds/steady-state"
STEADY_KIT_TARGET_RELDIR=".harness/steady-state"
STEADY_KIT_EMBEDDED=0

collect_steady_kit_files() {
  [ -d "$SOURCE_ROOT/$STEADY_KIT_RELDIR" ] || return 0
  ( cd "$SOURCE_ROOT/$STEADY_KIT_RELDIR" && find . -type f \
      ! -path '*/node_modules/*' \
      | sed 's|^\./||' | sort )
}

copy_steady_state_kit() {
  if [ ! -d "$SOURCE_ROOT/$STEADY_KIT_RELDIR" ]; then
    warn "steady-state kit not found at $SOURCE_ROOT/$STEADY_KIT_RELDIR — skipping embed (step 2.13 ship-and-verify and the Mode B issue-pipeline scripts will be missing)."
    return 0
  fi

  local dest_root="$TARGET_DIR/$STEADY_KIT_TARGET_RELDIR"
  local count=0 relative target

  if [ "$DRY_RUN" -eq 1 ]; then
    log "Steady-state kit -> $STEADY_KIT_TARGET_RELDIR/:"
    while IFS= read -r relative; do
      [ -n "$relative" ] || continue
      log "  embed    $STEADY_KIT_TARGET_RELDIR/$relative"
      count=$((count + 1))
    done < <(collect_steady_kit_files)
    log "Steady-state kit (dry-run): $count files would be embedded."
    return 0
  fi

  rm -rf "$dest_root"
  mkdir -p "$dest_root"
  while IFS= read -r relative; do
    [ -n "$relative" ] || continue
    target="$dest_root/$relative"
    mkdir -p "$(dirname "$target")"
    cp -p "$SOURCE_ROOT/$STEADY_KIT_RELDIR/$relative" "$target"
    log "embedded $STEADY_KIT_TARGET_RELDIR/$relative"
    count=$((count + 1))
  done < <(collect_steady_kit_files)
  chmod +x "$dest_root/scripts/"*.sh 2>/dev/null || true

  STEADY_KIT_EMBEDDED=1
  log ""
  log "Steady-state kit embedded: $STEADY_KIT_TARGET_RELDIR/ ($count files)"
  log "  release verify (step 2.13): $STEADY_KIT_TARGET_RELDIR/scripts/ship-and-verify.sh <issue-number>"
}

# Adds ".harness/" to the target's .gitignore (creating the file if missing)
# so the embedded template tree is never committed into the project's own
# repo. Idempotent — a no-op once the exact line is present.
ensure_harness_dir_gitignored() {
  local gi="$TARGET_DIR/.gitignore" entry=".harness/"

  if [ "$DRY_RUN" -eq 1 ]; then
    if [ -f "$gi" ] && grep -qxF "$entry" "$gi" 2>/dev/null; then
      log "gitignore: '$entry' already present in .gitignore"
    else
      log "gitignore: would append '$entry' to .gitignore"
    fi
    return 0
  fi

  if [ -f "$gi" ]; then
    if grep -qxF "$entry" "$gi" 2>/dev/null; then
      log "gitignore: '$entry' already present in .gitignore"
      return 0
    fi
    # Guarantee a trailing newline first so the appended block never glues to
    # the file's last existing line.
    [ -s "$gi" ] && [ -z "$(tail -c1 "$gi" 2>/dev/null)" ] || printf '\n' >> "$gi"
    {
      printf '\n# loop-harness — embedded stack template (harness-owned, never project source)\n'
      printf '%s\n' "$entry"
    } >> "$gi"
    log "gitignore: appended '$entry' to .gitignore"
  else
    {
      printf '# loop-harness — embedded stack template (harness-owned, never project source)\n'
      printf '%s\n' "$entry"
    } > "$gi"
    log "gitignore: created .gitignore with '$entry'"
  fi
}

# ---------------------------------------------------------------------------
# Remote source materialization (no local clone)
# ---------------------------------------------------------------------------
# When the script is run standalone (curl|bash, or a lone copy) there is no
# harness checkout to copy from. Rather than maintain a hand-edited file
# manifest (which drifts every time the skeleton changes), we fetch the whole
# repo as a tarball into a temp dir and then reuse the EXACT local-mode copy
# logic (collect_skeleton_files + cp). The fetch supports private repos via
# `gh` or a token, and falls back to an anonymous tarball for public repos.
HARNESS_TMP=""
cleanup_harness_tmp() {
  [ -n "$HARNESS_TMP" ] && rm -rf "$HARNESS_TMP" 2>/dev/null || true
}

materialize_remote_source() {
  local repo="$HARNESS_REPO" ref="$HARNESS_REF"
  [ -n "$repo" ] || fail "no local harness clone found and HARNESS_REPO is unset. Run from a clone (scripts/install-harness.sh) or export HARNESS_REPO=owner/repo."
  command -v tar >/dev/null 2>&1 || fail "tar is required for remote installation."

  HARNESS_TMP="$(mktemp -d "${TMPDIR:-/tmp}/loop-harness.XXXXXX")" \
    || fail "could not create a temp dir for the remote fetch."
  trap cleanup_harness_tmp EXIT INT TERM

  local tarball="$HARNESS_TMP/src.tar.gz" got=0
  log "Fetching harness $repo@$ref (no local clone found) ..."

  # 1. gh — uses the user's auth, works for private AND public repos.
  if [ "$got" -eq 0 ] && command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if gh api "repos/$repo/tarball/$ref" > "$tarball" 2>/dev/null && [ -s "$tarball" ]; then
      got=1; log "  source: gh api tarball (authenticated)"
    fi
  fi

  # 2. token-authenticated curl — private or public.
  local tok="${HARNESS_GH_TOKEN:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"
  if [ "$got" -eq 0 ] && [ -n "$tok" ] && command -v curl >/dev/null 2>&1; then
    if curl -fsSL -H "Authorization: Bearer $tok" -H "Accept: application/vnd.github+json" \
         "https://api.github.com/repos/$repo/tarball/$ref" -o "$tarball" 2>/dev/null \
       && [ -s "$tarball" ]; then
      got=1; log "  source: token-authenticated tarball"
    fi
  fi

  # 3. anonymous tarball — public repos only.
  if [ "$got" -eq 0 ] && command -v curl >/dev/null 2>&1; then
    if curl -fsSL "https://codeload.github.com/$repo/tar.gz/refs/heads/$ref" \
         -o "$tarball" 2>/dev/null && [ -s "$tarball" ]; then
      got=1; log "  source: anonymous tarball (public)"
    fi
  fi

  [ "$got" -eq 1 ] || fail "could not fetch $repo@$ref. For a PRIVATE repo, authenticate first ('gh auth login' or export GH_TOKEN). Tried: gh, token curl, anonymous tarball."

  tar -xzf "$tarball" -C "$HARNESS_TMP" || fail "could not extract the harness tarball."
  # GitHub tarballs wrap the tree in a single top dir: <owner>-<repo>-<sha>/.
  # The skeleton lives at the repo root (flattened 2026-09-01).
  local top
  top="$(find "$HARNESS_TMP" -mindepth 1 -maxdepth 1 -type d ! -name '.*' | head -n1)"
  [ -n "$top" ] && [ -f "$top/AGENTS.md" ] && [ -f "$top/docs/about/HARNESS.md" ] \
    || fail "extracted tarball missing AGENTS.md or docs/about/HARNESS.md — unexpected archive layout."

  # Flip to local mode pointing at the extracted tree; all later copy logic
  # (collect_skeleton_files / copy_file / write_source_file) then just works.
  SOURCE_ROOT="$top"
  SOURCE_MODE="local"
}

# ---------------------------------------------------------------------------
# Protected-path conflict handling
# ---------------------------------------------------------------------------
check_protected_target_paths() {
  local conflicts=() item joined=""
  [ -e "$TARGET_DIR/AGENTS.md" ] && conflicts+=("AGENTS.md")
  [ -e "$TARGET_DIR/docs" ]      && conflicts+=("docs/")
  [ -e "$TARGET_DIR/scripts" ]   && conflicts+=("scripts/")
  [ -e "$TARGET_DIR/.claude" ]   && conflicts+=(".claude/")
  [ "${#conflicts[@]}" -gt 0 ] || return 0

  for item in "${conflicts[@]}"; do
    if [ -n "$joined" ]; then joined="$joined, $item"; else joined="$item"; fi
  done

  case "$REQUESTED_CONFLICT_ACTION" in
    merge)    CONFLICT_ACTION="merge"; log "Continuing with merge. Existing files will be skipped."; return 0 ;;
    override) CONFLICT_ACTION="override"; override_protected_target_paths; return 0 ;;
    stop)     warn_stop "target already contains protected harness paths: $joined. Refusing to install." ;;
  esac

  if [ "$YES" -eq 1 ] || ! can_prompt; then
    warn_stop "target already contains protected harness paths: $joined. Refusing to install. Use an empty target, move those paths, or pass --merge / --override."
  fi

  {
    printf 'Warning: target already contains protected harness paths: %s\n' "$joined"
    printf 'Choose how to continue:\n'
    printf '  1. Merge    Copy missing harness files, skip existing\n'
    printf '  2. Override Back up and replace AGENTS.md, docs/, scripts/ (.claude is merged, never moved)\n'
    printf '  3. Stop     Exit without writing files (recommended)\n'
  } > /dev/tty
  prompt_tty 'Choice [1/2/3, default 3]: '
  local choice; choice="$(read_tty)"
  case "$choice" in
    1|m|M|merge|Merge)       CONFLICT_ACTION="merge"; log "Continuing with merge. Existing files skipped." ;;
    2|o|O|override|Override) CONFLICT_ACTION="override"; override_protected_target_paths ;;
    ""|3|s|S|stop|Stop)      warn_stop "installation stopped by user." ;;
    *)                       warn_stop "unknown choice: $choice" ;;
  esac
}

override_protected_target_paths() {
  local protected
  # NOTE: .claude is deliberately NOT in this list. The harness .claude skeleton
  # is purely additive (stage-runner agent, stage-next/gate-check commands,
  # notifier hooks, settings.local.json). It must MERGE into an existing .claude
  # via per-file copy — NEVER wholesale-move the directory aside. Wholesale-moving
  # .claude is how a user's global ~/.claude got displaced. The hard guards in
  # the resolve section refuse a global ~/.claude outright; this keeps even a
  # project-level .claude from being moved.
  for protected in AGENTS.md docs scripts .githooks; do
    [ -e "$TARGET_DIR/$protected" ] || continue
    if [ "$DRY_RUN" -eq 1 ]; then
      log "override $protected (backup first)"; continue
    fi
    mkdir -p "$BACKUP_DIR"
    mv "$TARGET_DIR/$protected" "$BACKUP_DIR/$protected"
    log "removed  $protected (backup: ${BACKUP_DIR#"$TARGET_DIR"/}/$protected)"
  done
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
TARGET_INPUT="${HARNESS_TARGET_DIR:-$PWD}"
# Did the user name a target explicitly? --bootstrap REFUSES to fall back to the
# default ($PWD): a no-target bootstrap run from $HOME backs up + replaces
# ~/.claude. Set by -d / a positional / HARNESS_TARGET_DIR.
TARGET_EXPLICIT=0
[ -n "${HARNESS_TARGET_DIR:-}" ] && TARGET_EXPLICIT=1
YES=0
FORCE=0
DRY_RUN=0
BOOTSTRAP=0
SPEC_PATHS=()
REQUESTED_CONFLICT_ACTION=""
POSITIONAL_TARGET=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    -d|--directory) [ "$#" -ge 2 ] || fail "$1 requires a path"; TARGET_INPUT="$2"; TARGET_EXPLICIT=1; shift 2 ;;
    -y|--yes)       YES=1; shift ;;
    --force)        FORCE=1; shift ;;
    --bootstrap)    BOOTSTRAP=1; shift ;;
    --spec)         [ "$#" -ge 2 ] || fail "$1 requires a path"; SPEC_PATHS+=("$2"); shift 2 ;;
    --merge)        REQUESTED_CONFLICT_ACTION="merge"; shift ;;
    --override)     REQUESTED_CONFLICT_ACTION="override"; shift ;;
    --stop)         REQUESTED_CONFLICT_ACTION="stop"; shift ;;
    --dry-run)      DRY_RUN=1; shift ;;
    -h|--help)      usage; exit 0 ;;
    --)             shift; break ;;
    -*)             fail "Unknown option: $1" ;;
    *)              [ -z "$POSITIONAL_TARGET" ] || fail "Only one target path is supported"; POSITIONAL_TARGET="$1"; TARGET_EXPLICIT=1; shift ;;
  esac
done

if [ "$BOOTSTRAP" -eq 1 ]; then
  YES=1
  REQUESTED_CONFLICT_ACTION="override"
  FORCE=1
fi

if [ "${#SPEC_PATHS[@]}" -gt 0 ] && [ "$BOOTSTRAP" -eq 0 ]; then
  fail "--spec requires --bootstrap"
fi

# Resolve every --spec path (file or directory) into a flat list of files.
# SPEC_RELS is parallel to SPEC_FILES: each entry is the file's path RELATIVE to
# its --spec root (basename for a file arg; subdir/.../name inside a directory).
# A directory is walked RECURSIVELY (hidden dirs/files pruned) so nested inputs
# like source/ and reference/ are never silently dropped.
SPEC_FILES=()
SPEC_RELS=()
if [ "${#SPEC_PATHS[@]}" -gt 0 ]; then
  for spec in "${SPEC_PATHS[@]}"; do
    spec="$(expand_path "$spec")"
    if [ -d "$spec" ]; then
      spec_root="${spec%/}"
      while IFS= read -r -d '' f; do
        SPEC_FILES+=("$f")
        SPEC_RELS+=("${f#"$spec_root"/}")
      done < <(find "$spec_root" -type d -name '.*' -prune -o -type f ! -name '.*' -print0 | sort -z)
    elif [ -f "$spec" ]; then
      SPEC_FILES+=("$spec")
      SPEC_RELS+=("$(basename "$spec")")
    else
      fail "Spec path not found (expected a file or directory): $spec"
    fi
  done
  [ "${#SPEC_FILES[@]}" -gt 0 ] || fail "No spec input files resolved from --spec path(s)."
fi

if [ "$#" -gt 0 ]; then
  [ -z "$POSITIONAL_TARGET" ] || fail "Only one target path is supported"
  POSITIONAL_TARGET="$1"; TARGET_EXPLICIT=1; shift
fi
[ "$#" -eq 0 ] || fail "Unexpected extra arguments"
[ -n "$POSITIONAL_TARGET" ] && TARGET_INPUT="$POSITIONAL_TARGET"

# Bootstrap is destructive (implies --override --force). NEVER let it fall back to
# the current directory: a no-target `--bootstrap` run from $HOME backs up and
# replaces ~/.claude / docs/ / scripts/ / AGENTS.md. Require an explicit target.
if [ "$BOOTSTRAP" -eq 1 ] && [ "$TARGET_EXPLICIT" -eq 0 ]; then
  fail "--bootstrap requires an explicit target directory (e.g. ./my-new-project). Refusing to default to the current directory ($PWD) — bootstrap is destructive and a no-target run in \$HOME is how a global ~/.claude gets clobbered."
fi

# ---------------------------------------------------------------------------
# Resolve source (local clone or remote)
# ---------------------------------------------------------------------------
SCRIPT_PATH="${BASH_SOURCE[0]:-$0}"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" 2>/dev/null && pwd -P || printf '')"
SOURCE_ROOT=""
SOURCE_MODE="remote"
SOURCE_BASE_URL="${HARNESS_SOURCE_BASE_URL:-}"
SOURCE_BASE_URL="${SOURCE_BASE_URL%/}"
# Remote fetch target (used only when no local clone is found): the harness repo
# pulled as a tarball. No default — pass HARNESS_REPO=owner/repo explicitly.
HARNESS_REPO="${HARNESS_REPO:-}"
HARNESS_REF="${HARNESS_REF:-main}"

if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/../AGENTS.md" ] && [ -f "$SCRIPT_DIR/../docs/about/HARNESS.md" ]; then
  SOURCE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
  SOURCE_MODE="local"
fi

if [ "$YES" -eq 0 ] && can_prompt; then
  prompt_tty "Install loop-harness into [$TARGET_INPUT]: "
  REPLY_TARGET="$(read_tty)"
  [ -n "$REPLY_TARGET" ] && TARGET_INPUT="$REPLY_TARGET"
fi

TARGET_DIR="$(make_absolute_parent "$(expand_path "$TARGET_INPUT")")"
BACKUP_DIR="$TARGET_DIR/.harness-backup/$(date +%Y%m%d%H%M%S)"
CREATED=0
UPDATED=0
SKIPPED=0
CONFLICT_ACTION="install"

# ---------------------------------------------------------------------------
# Hard safety guards (defense in depth against displacing a global ~/.claude)
# ---------------------------------------------------------------------------
# 1. Never install INTO the home directory itself. The harness is a per-project
#    skeleton; $HOME holds the user's global config (~/.claude with skills,
#    plugins, credentials, memory). Installing here (esp. bootstrap's override)
#    moves those aside.
HOME_REAL="$(cd "$HOME" 2>/dev/null && pwd -P || printf '%s' "$HOME")"
if [ "$TARGET_DIR" = "$HOME_REAL" ]; then
  fail "refusing to install into your home directory ($TARGET_DIR). The harness installs a PER-PROJECT skeleton; pick a subdirectory, e.g. $TARGET_DIR/my-project."
fi
# 2. Never touch a GLOBAL Claude config. A target whose .claude carries any
#    global-only marker (skills/ plugins/ projects/ .credentials.json) is the
#    user's ~/.claude — the harness installs a PROJECT .claude, never the global.
if [ -d "$TARGET_DIR/.claude" ]; then
  for _m in skills plugins projects .credentials.json; do
    if [ -e "$TARGET_DIR/.claude/$_m" ]; then
      fail "refusing to install: $TARGET_DIR/.claude looks like a GLOBAL Claude config (found .claude/$_m). The harness installs a per-project .claude, never your global ~/.claude. Choose an empty or new project directory."
    fi
  done
fi

# ---------------------------------------------------------------------------
# Preflight engine check (always — even in dry-run, it's read-only)
# ---------------------------------------------------------------------------
preflight_check_engine

# ---------------------------------------------------------------------------
# Prepare target dir
# ---------------------------------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  log "Dry run: no files will be written."
elif [ ! -d "$TARGET_DIR" ]; then
  mkdir -p "$TARGET_DIR"
fi

if [ ! -d "$TARGET_DIR" ]; then
  [ "$DRY_RUN" -eq 1 ] || fail "Target directory could not be created: $TARGET_DIR"
  log "Target directory would be created: $TARGET_DIR"
fi

if [ -d "$TARGET_DIR" ]; then
  [ -w "$TARGET_DIR" ] || fail "Target directory is not writable: $TARGET_DIR"
else
  [ -w "$(dirname "$TARGET_DIR")" ] || fail "Target parent directory is not writable: $(dirname "$TARGET_DIR")"
fi

[ -d "$TARGET_DIR" ] && check_protected_target_paths

SOURCE_MODE_ORIG="$SOURCE_MODE"
if [ "$SOURCE_MODE" = "local" ]; then
  log "Harness source: $SOURCE_ROOT (local clone)"
else
  materialize_remote_source
  log "Harness source: $HARNESS_REPO@$HARNESS_REF (fetched to temp)"
fi
log "Target project: $TARGET_DIR"
log ""

# ---------------------------------------------------------------------------
# Copy the skeleton
# ---------------------------------------------------------------------------
while IFS= read -r relative; do
  [ -n "$relative" ] || continue
  copy_file "$relative"
done < <(collect_skeleton_files)

# Restore executable bit on shell scripts (cp -p preserves; chmod is a cheap
# belt-and-braces for any path that lost it).
if [ "$DRY_RUN" -eq 0 ]; then
  [ -d "$TARGET_DIR/.claude" ] && find "$TARGET_DIR/.claude" -type f -name '*.sh' -exec chmod +x {} \; 2>/dev/null || true
  [ -d "$TARGET_DIR/.githooks" ] && chmod +x "$TARGET_DIR/.githooks/"* 2>/dev/null || true
  [ -f "$TARGET_DIR/scripts/harness-verify-gate.sh" ] && chmod +x "$TARGET_DIR/scripts/harness-verify-gate.sh" 2>/dev/null || true
  [ -f "$TARGET_DIR/scripts/install-harness.sh" ] && chmod +x "$TARGET_DIR/scripts/install-harness.sh" 2>/dev/null || true
fi

# Activate the verify gate on an existing repo (bootstrap sets it after git init).
if [ "$DRY_RUN" -eq 0 ] && [ -d "$TARGET_DIR/.githooks" ]; then
  if [ "$BOOTSTRAP" -eq 0 ] && [ -d "$TARGET_DIR/.git" ] && command -v git >/dev/null 2>&1; then
    (cd "$TARGET_DIR" && git config core.hooksPath .githooks)
    log ""
    log "git hooks: core.hooksPath set to .githooks (harness verify gate active)"
  elif [ "$BOOTSTRAP" -eq 0 ] && [ ! -d "$TARGET_DIR/.git" ]; then
    log ""
    log "git hooks: .githooks shipped — run 'git init' then"
    log "           'git config core.hooksPath .githooks' to activate the gate."
  fi
fi

log ""
log "Done. Created: $CREATED, updated: $UPDATED, skipped: $SKIPPED."
# Guard the conditional status lines with || true: under set -e a false test in
# a trailing `[ ... ] && log` statement would abort the whole install right
# here, silently skipping the bootstrap extras below.
if [ "$SKIPPED" -gt 0 ] && [ "$FORCE" -eq 0 ]; then
  log "Existing files left untouched. Re-run with --force to overwrite (backups kept)."
fi
if [ "$FORCE" -eq 1 ] && [ "$UPDATED" -gt 0 ] && [ "$DRY_RUN" -eq 0 ]; then
  log "Backups were written to: $BACKUP_DIR"
fi

# ---------------------------------------------------------------------------
# Design-system pin banner
# ---------------------------------------------------------------------------
# docs/design-system/ ships with the skeleton (the `docs` SKELETON_PATH recurses,
# so design-rules.md + its VERSION pin travel into every project automatically).
# Surface the pinned Tier-1 version and the hard rule it enforces: every screen
# carrying a data grid or a create/edit form must classify to one §4 floorplan —
# the verify gate's design-system check (Gate 4) blocks an unclassified screen.
print_design_system_banner() {
  local version_file="$TARGET_DIR/docs/design-system/VERSION"
  local rules_file="docs/design-system/design-rules.md"
  [ -f "$TARGET_DIR/$rules_file" ] || return 0
  local ver="unversioned"
  if [ -f "$version_file" ]; then
    # First non-empty line of VERSION, trimmed (awk — portable across BSD/GNU;
    # the equivalent sed one-liner breaks on macOS/BSD sed and aborts set -e).
    ver="$(awk 'NF { gsub(/^[ \t]+|[ \t]+$/, ""); print; exit }' "$version_file" 2>/dev/null || true)"
    [ -n "$ver" ] || ver="unversioned"
    # The banner prints a literal "v" prefix; drop a leading v/V if VERSION
    # already carries one so we never render "vv2".
    ver="${ver#[vV]}"
    [ -n "$ver" ] || ver="unversioned"
  fi
  log ""
  log "Tier-1 design-rules pinned at v${ver} ($rules_file) — every grid/form"
  log "screen must classify to one floorplan; see docs/playbooks/design-system-3-tier.md"
}
print_design_system_banner

# ---------------------------------------------------------------------------
# Embed the stack template so WORKFLOW step 2.4 scaffolds from a reachable,
# proven copy instead of the build agent hand-deriving tier-2. Runs for every
# install (normal and --bootstrap) and BEFORE the bootstrap auto-commit below,
# so the embed is gitignored before anything ever gets staged.
# ---------------------------------------------------------------------------
copy_stack_template
copy_steady_state_kit
ensure_harness_dir_gitignored

# ---------------------------------------------------------------------------
# Bootstrap extras
# ---------------------------------------------------------------------------
if [ "$BOOTSTRAP" -eq 1 ] && [ "$DRY_RUN" -eq 0 ]; then
  log ""
  log "Bootstrap mode active."

  # 1. git init (only if missing). Auto-commit happens ONLY when we init here.
  GIT_INIT_DONE=0
  if [ ! -d "$TARGET_DIR/.git" ]; then
    if command -v git >/dev/null 2>&1; then
      (cd "$TARGET_DIR" && git init -q)
      log "  git init: initialised empty repo at $TARGET_DIR/.git"
      GIT_INIT_DONE=1
      if [ -d "$TARGET_DIR/.githooks" ]; then
        (cd "$TARGET_DIR" && git config core.hooksPath .githooks)
        log "  git hooks: core.hooksPath set to .githooks (verify gate active)"
      fi
    else
      log "  git not found — skipping git init (run it manually)"
    fi
  else
    log "  git init: skipped (.git already exists — auto-commit also skipped)"
    if [ -d "$TARGET_DIR/.githooks" ] && command -v git >/dev/null 2>&1; then
      (cd "$TARGET_DIR" && git config core.hooksPath .githooks)
      log "  git hooks: core.hooksPath set to .githooks (verify gate active)"
    fi
  fi

  # 2. Spec inputs → docs/discovery/YYYY-MM-DD-<slug>.<ext> (VN diacritics folded).
  SPEC_COPIED=0
  if [ "${#SPEC_FILES[@]}" -gt 0 ]; then
    spec_dir="$TARGET_DIR/docs/discovery"
    mkdir -p "$spec_dir"
    spec_date="$(date +%Y-%m-%d)"
    spec_single=0
    [ "${#SPEC_FILES[@]}" -eq 1 ] && spec_single=1
    used_names=""
    NL='
'
    spec_i=0
    while [ "$spec_i" -lt "${#SPEC_FILES[@]}" ]; do
      src="${SPEC_FILES[$spec_i]}"
      rel="${SPEC_RELS[$spec_i]}"
      spec_i=$((spec_i + 1))

      # Nested inputs (e.g. source/Code.js, reference/recon.md) keep their
      # relative path + original filename so cross-references resolve. Only
      # top-level files get the dated-slug discovery naming below.
      case "$rel" in
        */*)
          spec_target="$spec_dir/$rel"
          if [ -e "$spec_target" ]; then
            log "  spec copy: SKIPPED — target exists: ${spec_target#"$TARGET_DIR"/}"
          else
            mkdir -p "$(dirname "$spec_target")"
            cp -p "$src" "$spec_target"
            log "  spec copy: ${src} → ${spec_target#"$TARGET_DIR"/}"
            SPEC_COPIED=$((SPEC_COPIED + 1))
          fi
          continue
          ;;
      esac

      spec_basename="$(basename "$src")"
      spec_ext="${spec_basename##*.}"
      case "$spec_ext" in "$spec_basename") spec_ext="md" ;; esac
      spec_ext="$(printf '%s' "$spec_ext" | tr '[:upper:]' '[:lower:]')"

      if [ "$spec_single" -eq 1 ]; then
        stem="initial-spec"
      else
        stem="$(slugify "${spec_basename%.*}")"
        [ -n "$stem" ] || stem="input"
      fi

      candidate="$stem"; suffix=2
      while case "$NL$used_names$NL" in *"$NL$candidate.$spec_ext$NL"*) true ;; *) false ;; esac; do
        candidate="$stem-$suffix"; suffix=$((suffix + 1))
      done
      used_names="$used_names$NL$candidate.$spec_ext"

      spec_target="$spec_dir/$spec_date-$candidate.$spec_ext"
      if [ -e "$spec_target" ]; then
        log "  spec copy: SKIPPED — target exists: ${spec_target#"$TARGET_DIR"/}"
      else
        cp -p "$src" "$spec_target"
        log "  spec copy: ${src} → ${spec_target#"$TARGET_DIR"/}"
        SPEC_COPIED=$((SPEC_COPIED + 1))
      fi
    done
    log "  spec inputs: ${#SPEC_FILES[@]} resolved, $SPEC_COPIED copied into docs/discovery/"
  fi

  # 3. STAGE.md root tracker — copy the per-project template to repo root and
  #    fill the Snapshot for a fresh Pre-Build project.
  stage_template="$TARGET_DIR/docs/mau-tai-lieu/STAGE.md"
  stage_root="$TARGET_DIR/STAGE.md"
  today="$(date +%Y-%m-%d)"
  if [ -e "$stage_root" ] && [ "$FORCE" -eq 0 ]; then
    log "  STAGE.md: SKIPPED — already exists at repo root"
  elif [ -e "$stage_template" ]; then
    cp -p "$stage_template" "$stage_root"
    # Fill the Snapshot block for a fresh project (Lane = project; at the very
    # start of Pre-Build, before PB-G1). Best-effort sed; template stays valid
    # if a line is absent.
    if command -v sed >/dev/null 2>&1; then
      tmp="$stage_root.tmp.$$"
      # Field labels match docs/mau-tai-lieu/STAGE.md § Snapshot. Step-specific
      # fields (Client-paging?, Conditional gates) keep their placeholders —
      # the agent sets those as the project advances.
      harness_source_note="$SOURCE_ROOT"
      [ -n "${HARNESS_REPO:-}" ] && [ "${SOURCE_MODE_ORIG:-local}" = "remote" ] \
        && harness_source_note="$HARNESS_REPO@$HARNESS_REF"
      if [ "$STACK_TEMPLATE_EMBEDDED" -eq 1 ]; then
        harness_source_note="$harness_source_note (stack template embedded: $STACK_TEMPLATE_TARGET_RELDIR/, TEMPLATE_VERSION $STACK_TEMPLATE_VERSION)"
      fi
      if [ "$STEADY_KIT_EMBEDDED" -eq 1 ]; then
        harness_source_note="$harness_source_note (steady-state kit embedded: $STEADY_KIT_TARGET_RELDIR/)"
      fi
      sed -E \
        -e 's|^- \*\*Macro-stage:\*\*.*$|- **Macro-stage:** Pre-Build|' \
        -e 's|^- \*\*Lane:\*\*.*$|- **Lane:** Full (default — revisit at intake 1.2; see docs/process/WORKFLOW.md § Lanes)|' \
        -e "s|^- \*\*Harness source:\*\*.*\$|- **Harness source:** $harness_source_note|" \
        -e 's|^- \*\*Current step:\*\*.*$|- **Current step:** 1.1 — Lead capture (PB-G1 not yet decided)|' \
        -e "s|^- \*\*Last completed:\*\*.*\$|- **Last completed:** bootstrap baseline on $today (harness skeleton installed)|" \
        -e 's|^- \*\*Next gate:\*\*.*$|- **Next gate:** PB-G1 — intake go/no-go (internal capture)|' \
        -e 's|^- \*\*Blockers:\*\*.*$|- **Blockers:** none|' \
        -e "s|^- \*\*Updated:\*\*.*\$|- **Updated:** $today by install-harness.sh|" \
        "$stage_root" > "$tmp" && mv "$tmp" "$stage_root"
    fi
    log "  STAGE.md: copied template to repo root + filled Snapshot for Pre-Build"
  else
    log "  STAGE.md: SKIPPED — template not found at docs/mau-tai-lieu/STAGE.md"
  fi

  # 4. .claude/settings.local.json — pre-register notifier hooks (gitignored).
  settings_local="$TARGET_DIR/.claude/settings.local.json"
  if [ -e "$settings_local" ]; then
    log "  .claude/settings.local.json: SKIPPED — already exists"
  elif [ -d "$TARGET_DIR/.claude" ]; then
    cat > "$settings_local" <<'SETTINGSJSON'
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh\"" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh\"" },
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/qa-deliver.sh\"" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/stage-deliver.sh\"" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-monitor.sh\"" }
        ]
      }
    ]
  }
}
SETTINGSJSON
    log "  .claude/settings.local.json: created with notifier hooks pre-registered"
    log "    (fill .claude/.env to activate — file is gitignored)"
  fi

  # 5. Auto-commit the bootstrap baseline — ONLY when we created .git, so an
  #    existing repo's history is never touched.
  if [ "$GIT_INIT_DONE" -eq 1 ]; then
    if (cd "$TARGET_DIR" && git rev-parse --verify HEAD >/dev/null 2>&1); then
      log "  baseline commit: SKIPPED — HEAD already exists"
    else
      commit_msg="chore: bootstrap loop-harness skeleton"
      if [ "${SPEC_COPIED:-0}" -gt 0 ]; then
        if [ "$SPEC_COPIED" -eq 1 ]; then
          commit_msg="$commit_msg + initial discovery spec"
        else
          commit_msg="$commit_msg + $SPEC_COPIED discovery inputs"
        fi
      fi
      git_identity_args=()
      if ! (cd "$TARGET_DIR" && git config user.email >/dev/null 2>&1); then
        git_identity_args+=(-c user.email=harness-bootstrap@local)
      fi
      if ! (cd "$TARGET_DIR" && git config user.name >/dev/null 2>&1); then
        git_identity_args+=(-c user.name='Harness Bootstrap')
      fi
      (
        cd "$TARGET_DIR"
        git add -A
        # --no-verify on the baseline ONLY: there is no behavior to verify yet
        # (TEST_MATRIX register is empty placeholders) and the gate's own hooks
        # are the files being committed. This is the single sanctioned bypass,
        # and it is the installer's, not an agent's — every later commit runs
        # the gate. --no-gpg-sign: greenfield target may lack signing config.
        git ${git_identity_args[@]+"${git_identity_args[@]}"} \
            commit -q --no-verify --no-gpg-sign -m "$commit_msg"
      )
      log "  baseline commit: created — \"$commit_msg\" (clean tree before Pre-Build)"
    fi
  fi

  # 6. Print the first /goal.
  cat <<NEXT

Next step — open Claude Code in this directory and paste the first goal:

  /goal docs/intake/${today}-intake-brief.md exists, faithfully restating the
  aggregate of docs/discovery/* per docs/mau-tai-lieu/client-intake-brief.md (and
  its locale-vi fork) — no derivations, open questions + assumptions logged. Mark
  the PB-G1 intake go/no-go decision (proceed | park | decline) INTERNALLY — do
  NOT page the client. Update STAGE.md Snapshot to Current = Pre-Build / 1.3
  (discovery) and add the 1.2 row to History in the same stage-boundary commit.
  Read STAGE.md, AGENTS.md, docs/process/WORKFLOW.md, docs/about/ROLE_MAP.md, and
  docs/about/TRACE_SPEC.md first. Stop after 10 turns.

What you bootstrapped:
  - The harness skeleton + STAGE.md root tracker (Snapshot pre-filled for
    Pre-Build) + your discovery spec inputs, if any — already committed.
  - The proven stack template embedded at .harness/stack-template/
    (gitignored) — step 2.4 scaffolds from here first; the harness-source
    clone/tarball is only the fallback if this embed is missing.
  - The verify gate is active (core.hooksPath=.githooks). Every commit runs
    lint/typecheck + Verification Register + stage-boundary atomicity +
    design-system classification. Do not bypass with --no-verify (AGENTS.md
    § Verify Gate — No Bypass).
  - Tier-1 design rules at docs/design-system/design-rules.md (the authoritative
    UI contract). Any screen with a data grid OR a create/edit form MUST classify
    to one §4 floorplan in docs/visuals/diagrams/screen-inventory.md — in EVERY
    lane, including Tiny/internal. The verify gate blocks an unclassified screen;
    a screen that fits no floorplan is declared CUSTOM per §4.7 with a one-line
    rationale in docs/decisions/<slug>.md. See docs/playbooks/design-system-3-tier.md.
  - Run \`cat STAGE.md\` any time to see which macro-stage/step this repo is at.

3-macro map (docs/process/WORKFLOW.md): Pre-Build → Build & Go-live → Post-Build —
all built fully. Lane: Full (paid client) or Lite (internal/small) — declare at
intake (1.2). Run loop: /stage-next per step; at Build 2.6 switch to
/build-phase (one manifest phase per invocation) until the manifest is done.
Client-paging gates: PB-G2, PB-G3, PB-G4, ACCEPTANCE, HANDOVER (owner acks in
the Lite lane). PB-G1 is internal — it does NOT page the client.

Engine note (Independence Principle): the ck-* skills referenced in WORKFLOW
steps are the live engine, invoked from your global ~/.claude — never vendored
into this project. If the preflight warned they are missing, the harness still
runs on a bare agent; those steps just lose their fast path.
NEXT
fi
