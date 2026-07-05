#!/usr/bin/env bash
# Harness verify gate — the non-bypassable Pre-Close Verification Gate.
#
# Invoked by .githooks/pre-commit (arg: pre-commit) and .githooks/pre-push
# (arg: pre-push). Blocks the git action (non-zero exit) when any gate fails.
# Authority: AGENTS.md § Verify Gate — No Bypass, docs/WORKFLOW.md § Always-On
# Layer (stage-boundary commits), docs/TRACE_SPEC.md (token chain), and the
# Verification Register format in docs/TEST_MATRIX.md.
#
# Four gates run on every invocation:
#   1. Lint / typecheck / quick-validate — auto-detected per stack
#      (npm / yarn / pnpm / make / cargo / none). Blocks on failure.
#   2. Verification Register integrity (docs/TEST_MATRIX.md) — blocks on any
#      `Result: fail` row; on a stage-close commit (STAGE.md staged) it also
#      blocks any `never-run` row.
#   3. Stage-boundary atomicity — when STAGE.md is staged (a stage-close
#      commit), ROADMAP.md must be staged in the SAME commit. They advance
#      together or not at all.
#   4. Design-system classification — when docs/visuals/diagrams/screen-inventory.md
#      exists, every screen row must carry a real floorplan classification. Blocks
#      on any data row whose Floorplan cell is empty or a placeholder. Skips
#      cleanly when the inventory file is absent (Pre-Build not yet reached), so
#      the harness source repo's own commits are never affected.
#
# Bypass: `git commit/push --no-verify` (or `-n`) skips this hook entirely.
# This escape is reserved for the HUMAN, who must state an explicit reason in
# the conversation. AGENTS MUST NOT bypass — a red gate means real work
# remains. Do not unset core.hooksPath to get past a blocked gate either.

set -u

mode="${1:-pre-commit}"

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$repo_root" || exit 0

matrix="docs/TEST_MATRIX.md"
fail=0

say() { printf '%s\n' "$*" >&2; }

# --- Self-check: hooks-path arming ------------------------------------------
# A gate that can silently disarm is not a gate. `pnpm install` runs a template
# `prepare: husky` script that re-points core.hooksPath to .husky/_ — the
# template's .husky hooks chain this script so it still fires, but warn loudly
# so the drift is visible and can be reverted (git config core.hooksPath
# .githooks). Anything else (empty/other) means only a manual invocation ran
# this gate — the next commit may run with NO gate at all.
hooks_path="$(git config core.hooksPath 2>/dev/null || true)"
if [ -d .githooks ] && [ "$hooks_path" != ".githooks" ]; then
  say "  [self-check] WARNING: core.hooksPath is '${hooks_path:-unset}' (expected .githooks)."
  case "$hooks_path" in
    .husky*) say "  [self-check] husky owns the hook path (a pnpm install re-arms it); the .husky hooks must chain this gate. Restore with: git config core.hooksPath .githooks" ;;
    *)       say "  [self-check] the harness gate is NOT armed as a git hook — future commits will skip it. Fix now: git config core.hooksPath .githooks" ;;
  esac
fi

# --- Gate 1: lint / typecheck / quick validate ------------------------------
# Auto-detect the project's validate command. Preference order within a stack:
# validate > lint > typecheck > check. Package-manager precedence is driven by
# the lockfile present (pnpm > yarn > npm). Make and Cargo are fallbacks. A
# project with no detectable command is allowed (the gate skips Gate 1) — the
# harness must stay runnable on a bare project; lint is enrichment, not a wall.
run_validate() {
  local cmd="" s t pm
  if [ -f package.json ]; then
    pm="npm"
    [ -f yarn.lock ] && pm="yarn"
    [ -f pnpm-lock.yaml ] && pm="pnpm"
    for s in validate lint typecheck check; do
      if command -v jq >/dev/null 2>&1; then
        jq -e --arg s "$s" '.scripts[$s]' package.json >/dev/null 2>&1 || continue
      else
        grep -qE "\"$s\"[[:space:]]*:" package.json || continue
      fi
      case "$pm" in
        npm)  cmd="npm run $s --silent" ;;
        yarn) cmd="yarn $s" ;;
        pnpm) cmd="pnpm run $s" ;;
      esac
      break
    done
  fi
  if [ -z "$cmd" ] && [ -f Makefile ]; then
    for t in validate lint check; do
      grep -qE "^$t:" Makefile && { cmd="make $t"; break; }
    done
  fi
  if [ -z "$cmd" ] && [ -f Cargo.toml ]; then
    cmd="cargo clippy --quiet -- -D warnings"
  fi
  if [ -z "$cmd" ]; then
    say "  [lint] no validate/lint/typecheck command detected — skipped"
    return 0
  fi
  say "  [lint] running: $cmd"
  if eval "$cmd" >&2; then
    say "  [lint] passed"
    return 0
  fi
  say "  [lint] FAILED — fix the errors above (do not bypass with --no-verify)"
  return 1
}

# --- Stage-close detection --------------------------------------------------
# A stage-close commit moves a WORKFLOW step forward: STAGE.md is staged. On
# such commits the register check is strict (never-run is also a block) and the
# atomicity check (Gate 3) is enforced. Only meaningful at pre-commit time —
# pre-push inspects already-committed content, so it always runs the lenient
# register check and skips the staged-atomicity check.
stage_close=0
if [ "$mode" = "pre-commit" ]; then
  if git diff --cached --name-only -- STAGE.md 2>/dev/null | grep -qx "STAGE.md"; then
    stage_close=1
  fi
fi

# --- Gate 2: Verification Register integrity --------------------------------
# Parse docs/TEST_MATRIX.md § Verification Register. The register is a markdown
# table; the second-to-last column is `Result` (pass / fail / never-run). Block
# on any `Result: fail`. On a stage-close commit, also block `never-run`.
check_register() {
  [ -f "$matrix" ] || { say "  [verify] no $matrix yet — register check skipped"; return 0; }
  local violations
  # The Result column is a strict enum: pass | fail | never-run. We only treat a
  # markdown table row as a register row when its Result cell, stripped of
  # backticks/markdown/whitespace, is EXACTLY one of those tokens. This is what
  # makes the parser robust against the descriptive/legend tables that also live
  # in the Verification Register section (e.g. a "Column spec" table whose cells
  # mention the word "fail" in prose) — those never equal the enum exactly, so
  # they are ignored. Header (`Result`), separators (`---`), and placeholder
  # rows (`_TBD_`, `TBD`) are skipped explicitly.
  violations="$(awk -v strict="$stage_close" '
    # Leaving the register section resets the flag.
    /^## / && !/^## Verification Register/ { inreg=0 }
    /^## Verification Register/ { inreg=1; next }
    inreg && /^\|/ {
      n = split($0, a, "|");
      if (n < 4) next;                 # too few columns to be a register row
      # First cell (behavior / token) and the Result cell (n-1; a[n] is the
      # trailing "" after the last pipe).
      story  = a[2];   gsub(/^[ \t]+|[ \t]+$/, "", story);
      result = a[n-1]; gsub(/^[ \t]+|[ \t]+$/, "", result);
      # Normalise the Result cell: drop markdown emphasis/backticks/spaces and
      # lowercase, so `pass`, **fail**, etc. reduce to the bare token.
      rl = tolower(result); gsub(/[`*_ \t]/, "", rl);
      # Only a cell that IS exactly the enum counts. Anything else (prose,
      # legend, separator) is not a register data row.
      if (rl != "pass" && rl != "fail" && rl != "never-run") next;
      # Skip placeholder/header story cells.
      if (story == "Story" || story == "Token" || story == "Behavior / TC-NNN" \
          || story ~ /^:?-+:?$/ || story == "TBD" || story == "_TBD_" || story == "") next;
      if (rl == "fail")                            print "fail\t"      story " (Result: " result ")";
      else if (rl == "never-run" && strict == "1") print "never-run\t" story " (Result: " result ")";
    }
  ' "$matrix")"
  if [ -n "$violations" ]; then
    say "  [verify] Pre-Close Verification Gate BLOCKED:"
    printf '%s\n' "$violations" | while IFS="$(printf '\t')" read -r kind detail; do
      if [ "$kind" = "fail" ]; then
        say "    - failing proof committed: $detail"
      else
        say "    - stage close with unverified row: $detail"
      fi
    done
    say "  [verify] Run the Verify command, record Result: pass in"
    say "           $matrix § Verification Register, or document why none exists"
    say "           (pure-docs, design-only, or a MANUAL: checkpoint the human signed)."
    return 1
  fi
  say "  [verify] register clean"
  return 0
}

# --- Gate 3: Stage-boundary atomicity ---------------------------------------
# WORKFLOW.md § Always-On Layer: a stage-boundary commit advances STAGE.md AND
# docs/ROADMAP.md in the SAME commit (current-stage pointer + module progress
# move together). If STAGE.md is staged but ROADMAP.md exists and is NOT staged,
# the commit splits an atomic advance — block it. (If ROADMAP.md does not exist
# yet — e.g. before the Pre-Build skeleton lands it — there is nothing to keep
# atomic, so the check is a no-op.)
check_atomicity() {
  [ "$stage_close" -eq 1 ] || return 0
  [ -f docs/ROADMAP.md ] || { say "  [atomicity] no docs/ROADMAP.md yet — check skipped"; return 0; }
  if git diff --cached --name-only -- docs/ROADMAP.md 2>/dev/null | grep -qx "docs/ROADMAP.md"; then
    say "  [atomicity] STAGE.md + docs/ROADMAP.md advance together — ok"
    return 0
  fi
  say "  [atomicity] Stage-boundary commit BLOCKED:"
  say "    - STAGE.md is staged but docs/ROADMAP.md is not."
  say "  [atomicity] A stage-boundary commit must advance STAGE.md (current-stage"
  say "           pointer + History row) AND docs/ROADMAP.md (module progress) in"
  say "           the SAME commit. Stage them together:  git add docs/ROADMAP.md"
  say "           If this close changes no module progress (doc-only / repair"
  say "           commit), refresh the ROADMAP 'Updated:' line — that keeps the"
  say "           file honestly current and satisfies this gate."
  return 1
}

# --- Gate 4: Design-system classification -----------------------------------
# docs/design-system/design-rules.md (Tier-1) makes floorplan classification
# MANDATORY for any screen carrying a data grid OR a create/edit form, in EVERY
# lane. The mechanical proof of that rule lives in the Pre-Build screen inventory
# (docs/visuals/diagrams/screen-inventory.md): a markdown table where each screen
# row names its assigned §4 floorplan. This gate blocks any data row whose
# Floorplan cell is empty or a placeholder (`<...>`, `TODO`, `?`, `-`) — an
# unclassified grid/form screen is where layout drift is born.
#
# When the inventory file does not exist, the Pre-Build step that produces it has
# not been reached yet (and the harness source repo never has one) — the gate
# skips cleanly so it never blocks those commits. The Floorplan column is located
# by header name, so it tolerates extra columns and column re-ordering.
screen_inventory="docs/visuals/diagrams/screen-inventory.md"
check_design_system() {
  [ -f "$screen_inventory" ] || { say "  [design-system] skipped — no $screen_inventory yet"; return 0; }
  local violations
  violations="$(awk '
    function trim(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); return s }
    # Strip markdown emphasis/backticks for a tolerant placeholder comparison.
    function bare(s) { gsub(/[`*_]/, "", s); return trim(s) }
    /^\|/ {
      # A separator row (|---|:--:|...) carries no data — skip it.
      probe = $0; gsub(/[ \t]/, "", probe);
      if (probe ~ /^\|[:|-]+$/) next;

      n = split($0, a, "|");

      # Header row: locate the Floorplan column by name (case-insensitive).
      if (fp_col == 0) {
        for (i = 2; i <= n; i++) {
          h = tolower(bare(a[i]));
          # Prefix match so a qualified header still resolves, e.g.
          # "Floorplan (one §4, or CUSTOM+rationale)" or "Floorplan (§4 / CUSTOM)".
          if (h ~ /^floor ?plan/) { fp_col = i; }
        }
        # If this row named the column, treat it as the header and move on.
        if (fp_col != 0) next;
        # No Floorplan column yet and this row did not declare one: skip until we
        # find the header (guards against leading prose tables).
        next;
      }

      # Data row. Need a cell at the Floorplan position to judge it.
      if (n <= fp_col) next;
      screen = trim(a[2]);
      cell   = bare(a[fp_col]);
      lc     = tolower(cell);

      # Empty or placeholder => unclassified => block. Placeholders: a <...>
      # angle-bracket stub, TODO, a lone ?, or a lone dash.
      if (cell == "" || cell == "-" || cell == "?" \
          || lc == "todo" || lc == "tbd" || lc == "n/a" \
          || cell ~ /^<.*>$/) {
        if (screen == "") screen = "(unnamed row)";
        print screen "\t" (cell == "" ? "(empty)" : cell);
      }
    }
  ' "$screen_inventory")"
  if [ -n "$violations" ]; then
    say "  [design-system] Design-system classification BLOCKED:"
    printf '%s\n' "$violations" | while IFS="$(printf '\t')" read -r screen cell; do
      say "    - unclassified screen: $screen (Floorplan: $cell)"
    done
    say "  [design-system] Every grid/form screen must classify to ONE §4 floorplan"
    say "           in $screen_inventory (Tier-1: docs/design-system/design-rules.md)."
    say "           A screen that fits no floorplan: declare it CUSTOM per §4.7 with a"
    say "           one-line rationale in docs/decisions/<slug>.md, then put CUSTOM in"
    say "           the Floorplan cell — it must still obey shell/actions/states/a11y."
    return 1
  fi
  say "  [design-system] all screens classified"
  return 0
}

# --- Run gates --------------------------------------------------------------
say "harness verify gate ($mode):"
run_validate   || fail=1
check_register || fail=1
check_atomicity || fail=1
check_design_system || fail=1

if [ "$fail" -ne 0 ]; then
  say ""
  say "Commit/push blocked by harness verify gate. Fix the items above."
  say "Bypassing with --no-verify requires explicit human sign-off (AGENTS.md"
  say "§ Verify Gate — No Bypass). Agents must not bypass a red gate."
  exit 1
fi
exit 0
