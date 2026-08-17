# Decision — layer nesting: HARNESS is the outermost ring

**Status:** accepted · **Date:** 2026-08-17 · **Supersedes:** the ordering shipped in v7.3
(`prompt → context → harness → loop`, loop outermost) · **Owner doc:** `OPERATING-MODES.md`
§ four nested layers

## The conflict

Two industry framings of the same four ideas disagree about what wraps what, and both
are internally coherent:

| Framing | Nesting | Reads the layers as |
|---|---|---|
| **LangChain (2026)** | `prompt ⊂ context ⊂ harness ⊂ loop` — **loop outermost** | **control flow**: the loop decides whether to run the machine again, so it sits above the machine |
| **Ghosh / the LOOP-vs-GRAPH-vs-HARNESS framing** | `model+prompt ⊂ loop ⊂ graph ⊂ harness` — **harness outermost** | **authority / blast radius**: the harness is the environment everything executes inside, so nothing — including the loop controller — escapes it |

v7.3 shipped the first one **without noticing the second existed**, even though the
second appeared in the source material that started the review. That omission is the
actual defect this record closes.

## Decision

Adopt **harness outermost**: `model + prompt ⊂ loop ⊂ graph ⊂ harness`.

## Why

1. **It orders by blast radius, and blast radius is what actually bounds us.** A loop
   controller that runs *outside* the sandbox is a fiction — in a real deployment the
   sandbox contains everything, including whatever decides to re-run. Authority is the
   true outer boundary; control flow is not.
2. **It names our real failures.** Our worst recorded incidents are *authority*
   incidents, not stop-rule incidents: L15 (permission-mode is the bottleneck of every
   dispatch) and the still-open `bypassPermissions` hole. A model whose outermost ring
   is "what may this touch" puts our largest hole where we cannot miss it. The
   loop-outermost model puts a layer we are already decent at (bounded retry,
   fail-closed) in the most prominent position.
3. **Its failure triad is directly diagnostic** — *no loop → it never stops · no graph
   → you cannot see why · no harness → it can touch anything*. Each maps to a concrete
   gap we can point at, which is more than the ladder framing ever produced.
4. **It restores the graph layer we had written off.** Under the loop-outermost model
   graph was a footnote; here it is a ring, and its absence carries a stated price
   (*you cannot see why*) rather than a shrug. We still run no executable graph — but
   now the cost is on the books.

## What it does NOT mean

- **Not** "build a graph now." The decision changes the *map*, not the roadmap. The
  first rule still holds: do not diagram a workflow you still change weekly.
- **Not** a demotion of context engineering. Context is not a missing ring; it lives
  inside the harness (memory + what reaches the model).
- **Not** a repo rename. `loop-harness` still reads correctly — the harness is the
  product, the loop is what it bounds.

## How to overturn this

Bring evidence, not a diagram: a real incident where treating the loop as the outer
boundary would have caught something this ordering missed. Absent that, leave it —
flipping the map costs every doc that cites it, and we have now paid that once.
