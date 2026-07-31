#!/usr/bin/env python3
"""
Cron sync GitHub -> Plane cho elearning (bu 20% ma native integration khong lo).
Chay moi ~15 phut tren vps04 (user trung). Native lo: import issue, open/close, comment, PR.
Script nay lo: (1) kich import issue MOI (gan label), (2) State-chi-tiet + Module + Cycle +
description da render, cho cac item da co external_id. Resolve name->id DONG (khong hardcode UUID).

Auth: Plane key doc tu file; GitHub dung `gh` CLI (auth san cua user, repo scope).
Idempotent: PATCH state/description moi lan; Module/Cycle chi gan khi chua thuoc.
"""
import json, subprocess, urllib.request, urllib.error, time, sys, re
from collections import defaultdict

PLANE_KEY = open("/home/trung/.claude/projects/-home-trung-Desktop-Workspace-videcode-harness/memory/.secrets/plane-api-key").read().strip()
WS, PROJ = "reno-ai", "8c78e04d-e608-450d-a6b4-f7b67dfb5a29"
REPO = "RenoAI-Labs/elearning-platform"
B = f"https://plane.reno.ai.vn/api/v1/workspaces/{WS}/projects/{PROJ}"
PH = {"X-API-Key": PLANE_KEY, "Content-Type": "application/json"}
TRIGGER_LABEL = "Plane"   # gan label nay de kich native import issue moi

def log(*a): print(time.strftime("%H:%M:%S"), *a, flush=True)

# ---- Plane HTTP (backoff 429) ----
def preq(method, path, body=None):
    r = urllib.request.Request(B + path, data=(json.dumps(body).encode() if body is not None else None), headers=PH, method=method)
    for _ in range(6):
        try:
            with urllib.request.urlopen(r) as x:
                return x.status, json.loads(x.read() or "{}")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(8); continue
            return e.code, {}
    return 429, {}
def pall(path):
    s, j = preq("GET", path)
    return j.get("results", j if isinstance(j, list) else [])

# ---- GitHub qua gh CLI ----
def gh_json(args):
    p = subprocess.run(["gh"] + args, capture_output=True, text=True)
    return json.loads(p.stdout) if p.returncode == 0 and p.stdout.strip() else None
def gh_issue(n):
    # tra ve issue day du (co issue_field_values, milestone) + body_html (rendered)
    p = subprocess.run(["gh", "api", "-H", "Accept: application/vnd.github.full+json",
                        f"/repos/{REPO}/issues/{n}"], capture_output=True, text=True)
    return json.loads(p.stdout) if p.returncode == 0 else None
def gh_sub_issues(n):
    p = subprocess.run(["gh", "api", f"/repos/{REPO}/issues/{n}/sub_issues", "--jq", ".[].number"], capture_output=True, text=True)
    return [int(x) for x in p.stdout.split()] if p.stdout.strip() else []

def main():
    # 1. Plane: maps dong theo TEN (khong hardcode id)
    items = pall("/issues/?per_page=100")
    ext2pid = {int(i["external_id"]): i["id"] for i in items if i.get("external_source") == "GITHUB" and i.get("external_id")}
    states = {s["name"]: s["id"] for s in pall("/states/")}
    modules = {m["name"]: m["id"] for m in pall("/modules/")}
    cycles = {c["name"]: c["id"] for c in pall("/cycles/")}
    labels = {l["name"]: l["id"] for l in pall("/labels/")}
    ext2item = {int(i["external_id"]): i for i in items if i.get("external_source") == "GITHUB" and i.get("external_id")}
    PRIO = {"Urgent": "urgent", "High": "high", "Medium": "medium", "Low": "low"}  # GitHub -> Plane
    # membership hien tai (de idempotent Module/Cycle)
    mod_has = {name: {x["id"] for x in pall(f"/modules/{mid}/module-issues/")} for name, mid in modules.items()}
    cyc_has = {name: {x["id"] for x in pall(f"/cycles/{cid}/cycle-issues/")} for name, cid in cycles.items()}
    log(f"Plane: {len(ext2pid)} linked | states {len(states)} modules {len(modules)} cycles {len(cycles)}")

    # 2. GitHub: tat ca issue (open+closed) — bo issue rac neu can
    gh_list = gh_json(["issue", "list", "--repo", REPO, "--state", "all", "--limit", "300", "--json", "number,title"]) or []
    fnums = [i["number"] for i in gh_list if re.match(r"\[F-\d+\]", i["title"])]
    log(f"GitHub: {len(fnums)} issue F-*")

    trig = state_set = mod_set = cyc_set = desc_set = prio_set = type_set = 0
    parents_kids = []   # github num cua issue co sub-issue
    for n in fnums:
        pid = ext2pid.get(n)
        if not pid:
            # issue MOI chua co item Plane -> gan label kich native (backfill o lan cron sau)
            subprocess.run(["gh", "issue", "edit", str(n), "--repo", REPO, "--add-label", TRIGGER_LABEL],
                           capture_output=True, text=True)
            trig += 1
            continue
        gi = gh_issue(n)
        if not gi:
            continue
        if (gi.get("sub_issues_summary") or {}).get("total", 0) > 0:
            parents_kids.append(n)
        fields = {f["issue_field_name"]: (f.get("single_select_option") or {}).get("name") for f in gi.get("issue_field_values", [])}
        st_name = fields.get("States")
        mod_name = fields.get("Module")
        cyc_name = (gi.get("milestone") or {}).get("title")   # 'Phase 1'/'Phase 1.5'...
        # state (PATCH idempotent)
        if st_name and states.get(st_name):
            preq("PATCH", f"/issues/{pid}/", {"state": states[st_name]}); state_set += 1
        # description da render (body_html)
        bh = gi.get("body_html")
        if bh:
            preq("PATCH", f"/issues/{pid}/", {"description_html": bh}); desc_set += 1
        # module (chi gan neu chua thuoc)
        if mod_name and modules.get(mod_name) and pid not in mod_has.get(mod_name, set()):
            preq("POST", f"/modules/{modules[mod_name]}/module-issues/", {"issues": [pid]}); mod_set += 1
        # cycle (chi gan neu chua thuoc)
        if cyc_name and cycles.get(cyc_name) and pid not in cyc_has.get(cyc_name, set()):
            preq("POST", f"/cycles/{cycles[cyc_name]}/cycle-issues/", {"issues": [pid]}); cyc_set += 1
        # priority: GitHub custom field 'Priority' -> Plane priority built-in
        pr = PRIO.get(fields.get("Priority"))
        if pr:
            preq("PATCH", f"/issues/{pid}/", {"priority": pr}); prio_set += 1
        # type: GitHub Issue Type (Feature/Bug/Enhancement) -> them label Plane cung ten (neu chua co)
        tname = (gi.get("type") or {}).get("name")
        if tname and labels.get(tname):
            cur = (ext2item.get(n, {}).get("labels") or [])
            if labels[tname] not in cur:
                preq("PATCH", f"/issues/{pid}/", {"labels": cur + [labels[tname]]}); type_set += 1
        time.sleep(0.15)

    # 3. Parent/sub-issue: noi con->cha. Con chua tren Plane -> kich import (set parent lan sau).
    ext_now = {int(i["external_id"]): i["id"] for i in pall("/issues/?per_page=100")
               if i.get("external_source") == "GITHUB" and i.get("external_id")}
    par_set = child_trig = 0
    for pn in parents_kids:
        ppid = ext_now.get(pn)
        if not ppid:
            continue
        for k in gh_sub_issues(pn):
            if k in ext_now:
                preq("PATCH", f"/issues/{ext_now[k]}/", {"parent": ppid}); par_set += 1
            else:
                subprocess.run(["gh", "issue", "edit", str(k), "--repo", REPO, "--add-label", TRIGGER_LABEL], capture_output=True, text=True)
                child_trig += 1

    log(f"DONE: trigger-new={trig} state={state_set} desc={desc_set} module+={mod_set} cycle+={cyc_set} prio={prio_set} type+={type_set} parent={par_set} child-trig={child_trig}")

if __name__ == "__main__":
    main()
