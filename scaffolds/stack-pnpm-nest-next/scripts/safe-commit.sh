#!/usr/bin/env bash
# Commit an toan khi HAI phien cung ghi vao MOT cay lam viec.
#
# Vi sao can: mot worktree co dung MOT index. Phien A `git add` 13 duong dan;
# giua luc do va `git commit` cua no, phien B chay `git commit` - va B om tron
# ca 13 file cua A. Ben thua cuoc KHONG nhan loi nao, no nhan mot commit sach
# se chua viec cua nguoi khac duoi mot tieu de sai. Da xay ra 3 lan trong mot
# ngay, lan thu ba len toi origin.
#
# Ky luat khong chua duoc: luat "dung git add -A, luon ghi ro duong dan" bao ve
# A khoi B, khong bao ve theo chieu nguoc lai. Nen phai vá bang co che.
#
# HAI lop, lop thu hai moi la lop thuc su cuu:
#   1. Khoa: `mkdir` la thao tac nguyen tu, ai tao duoc thu muc thi giu khoa.
#   2. Khang dinh: TRUOC khi add, index phai RONG. Sau khi add, thu staged phai
#      DUNG BANG thu minh xin. Lech mot file la dung, khong commit.
#
#   bash scripts/safe-commit.sh -F msg.txt -- path1 path2
#   bash scripts/safe-commit.sh -m "tieu de" -- path1
set -euo pipefail

LOCK="${TMPDIR:-/tmp}/harness-commit-$(git rev-parse --show-toplevel 2>/dev/null | md5 -q 2>/dev/null || echo shared).lock"
STALE_S=900

usage() { echo "dung: $0 (-F <file> | -m <msg>) -- <path>..." >&2; exit 2; }

MSG_ARGS=(); PATHS=(); seen_sep=0
while [ $# -gt 0 ]; do
  case "$1" in
    --) seen_sep=1; shift ;;
    -F|-m) [ "$seen_sep" = 1 ] && usage; MSG_ARGS+=("$1" "$2"); shift 2 ;;
    -h|--help) usage ;;
    *) if [ "$seen_sep" = 1 ]; then PATHS+=("$1"); else usage; fi; shift ;;
  esac
done
[ ${#MSG_ARGS[@]} -gt 0 ] || usage
[ ${#PATHS[@]} -gt 0 ] || usage

# --- lop 1: khoa ------------------------------------------------------------
if [ -d "$LOCK" ]; then
  age=$(( $(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || stat -c %Y "$LOCK" 2>/dev/null || echo 0) ))
  if [ "$age" -gt "$STALE_S" ]; then
    echo "[safe-commit] khoa cu ${age}s (>${STALE_S}s) - coi nhu bo roi, don di." >&2
    rmdir "$LOCK" 2>/dev/null || true
  fi
fi
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  waited=$((waited + 2))
  [ "$waited" -le 300 ] || { echo "[safe-commit] cho khoa qua 5 phut, dung. Ai do dang commit hoac khoa ket: $LOCK" >&2; exit 1; }
  [ "$waited" = 10 ] && echo "[safe-commit] dang cho phien khac commit xong..." >&2
  sleep 2
done
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

# --- lop 2: khang dinh ------------------------------------------------------
pre=$(git diff --cached --name-only)
if [ -n "$pre" ]; then
  echo "[safe-commit] ✗ index KHONG rong truoc khi add - co nguoi khac dang dung dở:" >&2
  echo "$pre" | sed 's/^/    /' >&2
  echo "  Dung commit. Doi ho xong, hoac hoi ho truoc khi dong vao." >&2
  exit 1
fi

git add -- "${PATHS[@]}"

want=$(printf '%s\n' "${PATHS[@]}" | sort -u)
got=$(git diff --cached --name-only | sort -u)
extra=$(comm -13 <(echo "$want") <(echo "$got") || true)
if [ -n "$extra" ]; then
  echo "[safe-commit] ✗ staged NHIEU HON thu da xin - co nguoi add xen vao:" >&2
  echo "$extra" | sed 's/^/    thua: /' >&2
  git reset -q -- "${PATHS[@]}" 2>/dev/null || true
  exit 1
fi

git commit "${MSG_ARGS[@]}"
