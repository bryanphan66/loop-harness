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
  # Do tay tren mot du an that de biet phai bo nhung gi. Prettier doi `*chu*` ->
  # `_chu_`, can le lai bang (`|-|-|` -> `| - | - |`), doi dau dau dong `+` -> `-`,
  # them `>` vao dong trong trong khoi trich dan, VA dinh dang lai code ben trong
  # tai lieu - cai cuoi be `page.locator(x).filter(y)` thanh ba dong, nen so theo
  # DONG khong bat duoc, ma so theo TU cung khong: mot tu bi tach lam ba. Nen bo
  # het khoang trang va dau bo cuc, con lai mot chuoi ky tu.
  #
  # Danh doi da biet: mot thay doi chi o dau cau se bi coi la khong doi. Chap nhan
  # duoc - cau hoi cua bao cao nay la "noi dung co doi khong", khong phai "byte co
  # doi khong". Byte thi `git diff` tra loi roi.
  tr -d '[:space:]' < "$1" | tr -d '*_`>|+=:' | tr -d '\-' | sha256sum | cut -d' ' -f1
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

# Doi xung voi danh sach ben harness: DU AN cung phai khai duoc "toi co y khong
# mang file nay". Khong co cho khai thi mot adaptation hop le se bao MISSING mai
# mai, va bao cao lai bat dau day nguoi doc bo qua no - dung con benh MD-53.
#
# Ca that: mot du an tu bo von doi so hai cong (PB-G3 = hop dong, PB-G4 =
# prototype) vi khong co khach de ky hop dong. Hai file kit theo so goc tro
# thanh "thieu" vinh vien, va chep chung vao thi thanh HAI file cung xung mot
# ma cong.
#
# Moi dong: mot duong dan, `#` va ly do. Khai la mot tuyen bo doc lai duoc.
PROJ_IGNORE="$PROJECT/.harness-drift-ignore"
project_skips=""
[ -f "$PROJ_IGNORE" ] &&
  project_skips=$(sed -e 's/#.*//' -e 's/[[:space:]]*$//' "$PROJ_IGNORE" | grep -v '^$')
is_project_skip() {
  [ -n "$project_skips" ] || return 1
  printf '%s\n' "$project_skips" | grep -qxF "$1"
}

missing=(); stale=(); local_only=(); both=(); unknown=(); fmt_only=(); relocated=(); internal=(); declined=()

while IFS= read -r rel; do
  if is_internal "$rel"; then internal+=("$rel"); continue; fi
  if is_project_skip "$rel"; then declined+=("$rel"); continue; fi
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
# --- lop thu hai: SCRIPT CONG -------------------------------------------------
# Cong la rang cua ca bo harness. Neu chung lech ma khong ai biet thi moi thu o
# duoi deu chua duoc kiem that. Vay ma vong so o tren chi di qua `docs/` - do la
# gia tri mac dinh cua SCOPE tu ngay dau, va khong ai doi lai.
#
# Hai ben de script o hai duong dan khac nhau (harness: scaffolds/<stack>/scripts/,
# du an: scripts/), nen khong dung chung vong lap tren duoc - phai anh xa theo ten.
#
# So the nao: du an chay prettier tren .mjs, harness thi khong. Do tren mot du an
# that: 21/24 script "lech", chay ca hai ben qua prettier roi so lai thi 0 cai lech
# that. Nen dung chinh prettier cua du an lam thuoc do khi co; khong co thi lui ve
# so chuoi ky tu va NOI RA la da lui.
# Hai lop so script (`scripts/` va ban nhung) phai dung CHUNG mot phep so - hai
# noi tra loi cung mot cau hoi ma moi noi mot kieu la dung con benh MD-12. Lan
# dau viet, lop ban nhung chi dung norm_hash: khong xu duoc dau phay cuoi ma
# prettier them vao, nen bao lech oan mot file da dong bo.
same_content() {  # same_content <file_harness> <file_du_an>
  cmp -s "$1" "$2" && return 0
  if [ "${1##*.}" = "mjs" ] && [ "$have_prettier" = "1" ]; then
    (cd "$PROJECT" && diff -q \
        <(npx --no-install prettier --stdin-filepath x.mjs < "$1" 2>/dev/null) \
        <(npx --no-install prettier --stdin-filepath x.mjs < "$2" 2>/dev/null)) >/dev/null 2>&1 && return 0
  fi
  [ "$(norm_hash "$1")" = "$(norm_hash "$2")" ]
}

HSCRIPTS=$(ls -d "$HARNESS"/scaffolds/*/scripts 2>/dev/null | head -1)
have_prettier=0
(cd "$PROJECT" && npx --no-install prettier --version >/dev/null 2>&1) && have_prettier=1
script_drift=(); script_fmt=0; script_missing=()
if [ -n "$HSCRIPTS" ] && [ -d "$PROJECT/scripts" ]; then
  for hf in "$HSCRIPTS"/*.mjs "$HSCRIPTS"/*.sh; do
    [ -f "$hf" ] || continue
    bn=$(basename "$hf"); pf="$PROJECT/scripts/$bn"
    is_internal "scripts/$bn" && continue
    [ -f "$pf" ] || { script_missing+=("scripts/$bn"); continue; }
    cmp -s "$hf" "$pf" && continue
    if same_content "$hf" "$pf"; then script_fmt=$((script_fmt + 1)); continue; fi
    script_drift+=("scripts/$bn")
  done
  if [ "$have_prettier" -eq 0 ]; then
    echo "[drift] khong goi duoc prettier cua du an - script .mjs so bang chuoi ky tu, kem chinh xac hon."
    echo
  fi
fi

# --- ban NHUNG cua bo khung ---------------------------------------------------
# Installer nhung ca bo khung vao `.harness/stack-template/`, roi du an bung no
# ra thanh `scripts/`. Ket qua: HAI ban cua moi cong, ca hai deu chay duoc, va
# tu do ve sau khong ai dong bo ban nhung nua.
#
# Do tren mot du an that: 3 trong 23 script o ban nhung lech NOI DUNG so voi ban
# dang dung - va ca ba deu la ban TRUOC KHI VA, gom `req-issue-scaffold.mjs`
# phien ban van tra ve doan SRS cua yeu cau khac (MD-52). Mot qua min nam im:
# ai chay nham ban do, hoac dung du an moi tu no, la loi quay lai nguyen ven.
embed_drift=()
EMBED="$PROJECT/.harness/stack-template/scripts"
if [ -n "$HSCRIPTS" ] && [ -d "$EMBED" ]; then
  for hf in "$HSCRIPTS"/*.mjs "$HSCRIPTS"/*.sh; do
    [ -f "$hf" ] || continue
    bn=$(basename "$hf"); ef="$EMBED/$bn"
    [ -f "$ef" ] || continue
    same_content "$hf" "$ef" && continue
    embed_drift+=(".harness/stack-template/scripts/$bn")
  done
fi

# --- hai file cung xung mot ma cong ------------------------------------------
# Chep mot file kit "con thieu" vao du an KHONG an toan khi chi so theo TEN FILE.
# Du an co the da so huu chinh artifact do duoi mot ten khac, doi co chu dich -
# gate file mang ma cong ngay trong ten, nen "doi so" la mot dang adaptation hop
# le (vi du: san pham tu bo von thi cong hop dong thanh N/A va doi cho cho cong
# dong bang prototype).
#
# Ca that: chep pb-g3-prototype-frozen.md + pb-g4-contract-deposit.md tu harness
# vao mot du an von da co pb-g3-contract-deposit.md + pb-g4-prototype-frozen.md.
# Ket qua: HAI file cung xung PB-G3 va HAI file cung xung PB-G4 nam canh nhau -
# cau hoi "PB-G3 la cong nao" co hai cau tra loi tren dia.
#
# Ma cong nam o heading dau file (`# Gate PB-G3 — ...`), nen kiem duoc bang may.
dup_gate=()
if [ -d "$PROJECT/docs/gates" ]; then
  while IFS= read -r gid; do
    [ -n "$gid" ] || continue
    dup_gate+=("$gid")
  done < <(grep -hoE '^# Gate [A-Za-z0-9-]+' "$PROJECT"/docs/gates/*.md 2>/dev/null \
             | sed 's/^# Gate //' | sort | uniq -d)
fi

report "MISSING" "the harness has these and this project does not — copy them in" ${missing[@]+"${missing[@]}"}
report "STALE"   "the harness moved and this project did not — sync these down"   ${stale[@]+"${stale[@]}"}
report "BOTH"    "both moved — read both sides before either wins"                ${both[@]+"${both[@]}"}
report "LOCAL"   "this project moved and the harness did not — project content, or a fix that belongs upstream" ${local_only[@]+"${local_only[@]}"}
report "DIFFERS" "no baseline for these, so the cause is unknown" ${unknown[@]+"${unknown[@]}"}
report "RELOCATED?" "harness keeps these at a NEW path and a file of the same name exists elsewhere here — a directory move, not an absence" ${relocated[@]+"${relocated[@]}"}
report "EMBED-DRIFT" "the EMBEDDED kit under .harness/stack-template still holds pre-fix copies — a dormant landmine" ${embed_drift[@]+"${embed_drift[@]}"}
report "DUP-GATE-ID" "two files in docs/gates claim the SAME gate id — the canonical question has two answers on disk" ${dup_gate[@]+"${dup_gate[@]}"}
report "SCRIPT-DRIFT" "GATE SCRIPTS whose behaviour differs — the enforcement layer itself is out of sync" ${script_drift[@]+"${script_drift[@]}"}
report "SCRIPT-MISSING" "the harness ships these gate scripts and this project has none" ${script_missing[@]+"${script_missing[@]}"}
report "FORMAT-ONLY" "byte-different, word-identical — a markdown formatter's choice is not drift" ${fmt_only[@]+"${fmt_only[@]}"}

blocking=$(( ${#missing[@]} + ${#stale[@]} + ${#both[@]} + ${#script_drift[@]} + ${#script_missing[@]} + ${#dup_gate[@]} + ${#embed_drift[@]} ))
if [ "$blocking" -eq 0 ]; then
  echo "in sync: nothing missing, nothing stale, no gate script drifted."
  echo "  ${#local_only[@]} file(s) are this project's own; ${script_fmt} gate script(s) differ only in formatting."
  exit 0
fi
echo "$blocking file(s) need attention. LOCAL, RELOCATED? and FORMAT-ONLY are not counted"
echo "  (${#relocated[@]} relocated, ${#fmt_only[@]} format-only, ${#local_only[@]} local, ${#internal[@]} harness-internal by declaration,"
echo "   ${script_fmt} gate scripts differing only in formatting, ${#declined[@]} declined by this project)."
exit 1
