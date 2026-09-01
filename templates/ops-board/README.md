# Ops-board — the internal status surface, made visible

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none (renders correctly in both themes; **never yet run on real data**)

The internal ops-board that `docs/HARNESS.md` § Status Artifact and
`playbooks/status-surfaces-ops-and-client.md` already specify — this is the
first *drawn* version of it. One self-contained HTML file, no build step, no
dependency, no external request.

> **This is the INTERNAL surface.** It shows engineering truth: worker ids, SHAs,
> harness versions, blocked counts. A client is never handed this page — the
> client-facing roadmap is a **separate file at a separate URL** (D4 + the
> status-surfaces playbook). Do not merge the two.

## What it shows — and what it deliberately doesn't

It answers the four questions nothing else in the harness answers:

| Question | Section |
|---|---|
| Which worker is running, which is stuck? | Worker đang chạy |
| How long does a loop take, how often does QC fail? | Số của kỳ này |
| Where is work piling up? | Đang ùn ở đâu |
| **Is harness vX actually better than vX-1?** | Bản harness nào tốt hơn |

It does **not** redraw the 10-state issue board — GitHub already draws that well,
and a second rendering of the same thing is a second source of truth waiting to
drift (FC6's spirit). The six-beat diagram at the top is the exception: it exists
because the loop's *shape* is the thing newcomers cannot picture, and it labels
`recover` with a dashed ring precisely because R1 is still unbuilt.

## Feeding it real data

Two optional files, fetched from the same directory as `index.html`:

| File | Produced by | Missing → |
|---|---|---|
| `run-log.jsonl` | `scripts/run-log.mjs` (`start` / `end` around each dispatch) | that half falls back to demo numbers |
| `board.json` | **not built yet** — see below. Shape: `board.sample.json` | that half falls back to demo numbers |

**The banner tells the truth about which half is real.** A page that silently
shows fabricated numbers on a real URL is worse than no page; the demo state is
loud and names the missing file. Do not remove that banner to make a screenshot
look better.

Copy the log next to the page at deploy time:

```bash
cp ~/.claude/loop-harness/run-log.jsonl ./run-log.jsonl
```

### Not built: the `board.json` generator

The shape is fixed (`board.sample.json`) but nothing produces it yet — it needs
`gh` issue timestamps per state plus `claude agents --json`. Written blind it
would be an unverified script shipped as if it worked, which is the failure this
harness keeps closing. Build it against a real board, then record it here.

## Deploying it (Dokploy)

Static image, one port, no env, no secret.

1. Dokploy → project → **Create Application** → source **Git**, repo
   `loop-harness`, branch of your choice.
2. **Build Type: Dockerfile**, Docker context path
   `templates/ops-board`.
3. **Domains** → add the host, port **80**, HTTPS on. A `*.sslip.io` host
   resolves to the IP embedded in its own name, so no DNS record is needed.
4. Deploy, then **verify at source** — never trust the green deploy line:

```bash
curl -fsS https://<host>/healthz                     # -> ok
curl -fsS https://<host>/ | grep -c 'ops-board'      # -> 1
```

5. To serve real numbers, mount a volume onto
   `/usr/share/nginx/html/run-log.jsonl` (host file → container file) and refresh
   it however you refresh it. No rebuild — the image holds no data on purpose.

**Access:** this page exposes internal engineering state on a public host. Put it
behind Dokploy basic-auth or an IP allow-list before pointing anything at it — the
harness has no opinion about who may read your worker ids, so you must.
