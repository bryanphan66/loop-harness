#!/usr/bin/env bash
# harness-drift.sh — say who changed a harness-owned file: this project, or the harness.
#
#   ./scripts/harness-drift.sh [path-to-harness-checkout]
#   ./scripts/harness-drift.sh --rebaseline [path]   # a project installed before
#                                                    # provenance recording existed
#
# The installer is a one-shot copy, not a sync. Nothing re-runs, and nothing warns, so a
# project silently diverges from the harness for the rest of its life. That is not
# hypothetical: on 2026-09-04 an AutoContent round found six harness templates missing,
# three of them already cited by that project's own docs, and a step-goals file fifty-three
# lines behind — including the clause defining the review-round cap the project was, at that
# moment, ruling on.
#
# A plain `diff -r` cannot help there. It says the two trees differ; it cannot say whether
# the project edited the file or the harness moved on, and those need opposite responses.
# `.harness-provenance` (written at install) is the as-installed baseline that separates
# them, so every differing file lands in exactly one of four buckets:
#
#   MISSING  harness has it, project does not          → copy it in
#   STALE    harness moved, project did not            → sync it down
#   LOCAL    project moved, harness did not            → project content, or an upstream fix
#   BOTH     both moved                                → read both before either wins
#
# Read-only. It prints; it changes nothing. Exit 0 when only LOCAL files differ (the normal
# steady state), 1 when anything is MISSING, STALE or BOTH.
set -euo pipefail

REBASELINE=0
if [ "${1:-}" = "--rebaseline" ]; then REBASELINE=1; shift; fi

# The installer copies whole directories; docs/ is the one that matters in practice and the
# one a project edits. Widen SCOPE if that stops being true.
SCOPE=${SCOPE:-docs}

# Finding the harness is the whole point, so it must not depend on one machine's
# layout. This script used to guess only `vibecode-harness` - a repo that was
# renamed - so typing it bare printed "no harness found" and everyone stopped
# typing it. That is how a project drifted 83 files: the detector was alive but
# could never see anything. Provenance is no help either: `harness_source` in
# .harness-provenance records the path on the machine that installed the kit
# (`/home/nghia/vibecode-harness` in a real one), not a path that exists here.
#
# Order: explicit argument, then $HARNESS_REPO, then provenance if that path
# happens to exist locally, then the usual sibling/parent layouts under both
# names. Failing, say exactly what was tried - a guess list is only useful if
# the person can see it.
HARNESS=${1:-${HARNESS_REPO:-}}
TRIED=""
if [ -z "$HARNESS" ]; then
  PROV=""
  [ -f "$(dirname "$0")/../.harness-provenance" ] &&
    PROV=$(awk '$1=="harness_source"{print $2}' "$(dirname "$0")/../.harness-provenance" 2>/dev/null | head -1)
  for guess in \
    $PROV \
    "$HOME/Desktop/Workspace/loop-harness" "$HOME/loop-harness" \
    "../loop-harness" "../../loop-harness" \
    "$HOME/Desktop/Workspace/vibecode-harness" "$HOME/vibecode-harness" \
    "../vibecode-harness" "../../vibecode-harness"; do
    [ -n "$guess" ] || continue
    TRIED="$TRIED\n    $guess"
    [ -d "$guess/docs" ] && { HARNESS=$guess; break; }
  done
fi
[ -n "$HARNESS" ] && [ -d "$HARNESS/docs" ] || {
  echo "usage: $0 [path-to-harness-checkout]   (or set HARNESS_REPO)"
  echo "  khong tim thay harness. Da thu:$(printf "$TRIED")"
  exit 2
}
HARNESS=$(cd "$HARNESS" && pwd)
PROJECT=$(cd "$(dirname "$0")/.." && pwd)
[ "$HARNESS" != "$PROJECT" ] || { echo "refusing to compare the harness with itself"; exit 2; }

PROV="$PROJECT/.harness-provenance"

# A project installed before provenance existed has no baseline, so every difference reports
# as DIFFERS — true, and useless. --rebaseline writes one from the HARNESS's current content:
# "this is what the harness said when we last looked". Files the project owns then correctly
# read LOCAL from the next run on, and anything the harness moves afterwards reads STALE.
# It cannot recover what was actually installed, and does not pretend to — the header says so.
if [ "$REBASELINE" -eq 1 ]; then
  {
    echo "# vibecode-harness provenance — REBASELINED, not written at install."
    echo "# The baseline is the harness content at the commit below, NOT the content this"
    echo "# project was originally installed from: it predates provenance recording and that"
    echo "# history is gone. Good enough to tell LOCAL from STALE going forward, and no more."
    echo "installed_at   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "harness_commit $(cd "$HARNESS" && git rev-parse HEAD 2>/dev/null || echo unknown)"
    echo "harness_source $HARNESS"
    echo "# --- manifest: sha256  path (harness content at rebaseline) ---"
    (cd "$HARNESS" && find "$SCOPE" -type f -name '*' | grep -v '/[.]git/' | sort | xargs -r sha256sum)
  } > "$PROV"
  echo "rebaselined against $(cd "$HARNESS" && git rev-parse --short HEAD 2>/dev/null || echo unknown): $PROV"
  echo "  Files this project owns will read LOCAL instead of DIFFERS from the next run on."
  exit 0
fi

have_baseline=0
[ -f "$PROV" ] && have_baseline=1

echo "harness drift:"
echo "  project  $PROJECT"
echo "  harness  $HARNESS  ($(cd "$HARNESS" && git rev-parse --short HEAD 2>/dev/null || echo 'not a git checkout'))"
if [ "$have_baseline" -eq 1 ]; then
  echo "  installed $(grep -m1 '^installed_at'   "$PROV" | awk '{print $2}') from $(grep -m1 '^harness_commit' "$PROV" | awk '{print $2}' | cut -c1-12)"
else
  echo "  installed (no .harness-provenance — this project predates provenance recording)"
  echo "            without it, LOCAL and STALE cannot be told apart; both report as DIFFERS."
fi
echo

baseline() {  # baseline <relpath> -> sha256 as installed, or empty
  [ "$have_baseline" -eq 1 ] || return 0
  awk -v p="$1" '$2 == p { print $1; exit }' "$PROV"
}
hash_of() { [ -f "$1" ] && sha256sum "$1" | cut -d' ' -f1 || true; }

# Nhieu la ly do that su khien khong ai doc bao cao nay. Do lan dau tren mot du an
# that: 83 file "can xu ly", so lech THAT chi vai cai. Hai nguon nhieu:
#
#   1. Du an chay prettier tren markdown, harness thi khong. Prettier doi `*chu*`
#      thanh `_chu_` va can le lai moi bang -> byte khac, chu khong doi. Lua chon
#      cua mot trinh dinh dang KHONG phai drift.
#   2. Harness don lai thu muc (docs/X.md -> docs/about/X.md). Duong dan moi bao
#      MISSING, con ban cu nam o duong dan cu thi khong ai doi chieu -> 68 dong
#      bao "thieu" trong khi file van nam do.
#
# Bao cao keu sai 80 lan thi lan thu 81 keu dung cung khong ai nghe. Nen: van phan
# buong bang hash tho (baseline la hash tho, khong doi duoc), roi LOC bao cao.
norm_hash() {  # hash sau khi bo dinh dang: dam/nghieng, padding bang, khoang trang
  [ -f "$1" ] || return 0
  # Do tay tren mot du an that de biet phai bo nhung gi: prettier doi `*chu*` ->
  # `_chu_`, can le lai o bang (`|-|-|` -> `| - | - |`), doi dau dau dong `+` -> `-`,
  # va them dau `>` vao dong trong trong khoi trich dan. Khong cai nao la thay doi
  # NOI DUNG. Bo het, roi bo luon nhung dong chi con dau cau.
  sed -e 's/[*_`]//g' -e 's/-\{2,\}/-/g' -e 's/[[:space:]]\{1,\}/ /g' \
      -e 's/ *| */|/g' -e 's/^[-+] /- /' -e 's/^ //' -e 's/ $//' "$1" \
    | grep -vE '^[>|+ -]*$' | sha256sum | cut -d' ' -f1
}

# File cua rieng harness, khong phai cua kit. Khai o mot file doc duoc chu khong
# nhet cung vao script: mot danh sach bo qua ma khong ai biet no ton tai thi lan
# sau co nguoi lai di tim xem "sao file nay khong bao gio bao thieu".
INTERNAL_LIST="$HARNESS/docs/about/not-shipped-to-projects.md"
internal_paths=""
if [ -f "$INTERNAL_LIST" ]; then
  internal_paths=$(sed -n 's/^| `\([^`]*\)` |.*/\1/p' "$INTERNAL_LIST")
fi
is_internal() {
  [ -n "$internal_paths" ] || return 1
  printf '%s\n' "$internal_paths" | grep -qxF "$1"
}

missing=(); stale=(); local_only=(); both=(); unknown=(); fmt_only=(); relocated=(); internal=()

while IFS= read -r rel; do
  if is_internal "$rel"; then internal+=("$rel"); continue; fi
  h=$(hash_of "$HARNESS/$rel")
  p=$(hash_of "$PROJECT/$rel")
  if [ -z "$p" ]; then
    # Cung ten file nam cho khac trong du an = nhieu kha nang harness doi thu muc,
    # khong phai du an thieu file.
    if [ -n "$(find "$PROJECT/$SCOPE" -type f -name "$(basename "$rel")" -print -quit 2>/dev/null)" ]; then
      relocated+=("$rel")
    else
      missing+=("$rel")
    fi
    continue
  fi
  [ "$h" != "$p" ] || continue
  if [ "$(norm_hash "$HARNESS/$rel")" = "$(norm_hash "$PROJECT/$rel")" ]; then
    fmt_only+=("$rel"); continue
  fi
  b=$(baseline "$rel")
  if [ -z "$b" ]; then unknown+=("$rel")
  elif [ "$b" = "$p" ]; then stale+=("$rel")
  elif [ "$b" = "$h" ]; then local_only+=("$rel")
  else both+=("$rel"); fi
done < <(cd "$HARNESS" && find "$SCOPE" -type f ! -path '*/.git/*' | sort)

report() {  # report <label> <explanation> <items...>
  local label=$1 why=$2; shift 2
  [ "$#" -gt 0 ] || return 0
  printf '%s (%d) — %s\n' "$label" "$#" "$why"
  printf '   %s\n' "$@"
  echo
}
# ${arr[@]+"${arr[@]}"} expands to NOTHING when the array is empty. The tempting
# "${arr[@]:-}" expands to one empty string instead, which reports every empty bucket
# as a bucket of size 1 — wrong, and wrong in the reassuring direction.
report "MISSING" "the harness has these and this project does not — copy them in" ${missing[@]+"${missing[@]}"}
report "STALE"   "the harness moved and this project did not — sync these down"   ${stale[@]+"${stale[@]}"}
report "BOTH"    "both moved — read both sides before either wins"                ${both[@]+"${both[@]}"}
report "LOCAL"   "this project moved and the harness did not — project content, or a fix that belongs upstream" ${local_only[@]+"${local_only[@]}"}
report "DIFFERS" "no baseline for these, so the cause is unknown" ${unknown[@]+"${unknown[@]}"}
report "RELOCATED?" "harness keeps these at a NEW path and a file of the same name exists elsewhere here — a directory move, not an absence" ${relocated[@]+"${relocated[@]}"}
report "FORMAT-ONLY" "byte-different, word-identical — a markdown formatter's choice is not drift" ${fmt_only[@]+"${fmt_only[@]}"}

blocking=$(( ${#missing[@]} + ${#stale[@]} + ${#both[@]} ))
if [ "$blocking" -eq 0 ]; then
  echo "in sync: nothing missing, nothing stale. ${#local_only[@]} file(s) are this project's own."
  exit 0
fi
echo "$blocking file(s) need attention. LOCAL, RELOCATED? and FORMAT-ONLY are not counted"
echo "  (${#relocated[@]} relocated, ${#fmt_only[@]} format-only, ${#local_only[@]} local, ${#internal[@]} harness-internal by declaration)."
exit 1
