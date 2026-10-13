# Product Context

## Problem
AI site generators ship recognizable defaults: purple gradients, Inter/Geist
type, pill badges over centered heroes, "delve / unlock / seamless" copy,
shadcn card grids, blurred blobs. People want a fun way to check their site.

## How it should work
1. User picks **Link** or **Screenshot** tab.
2. Link: backend fetches readable markup through a text proxy
   (`r.jina.ai`), runs ~20 heuristic detectors across framework / type /
   color / copy / layout / imagery, scores 0–100, returns findings +
   screenshot preview URL (thum.io).
3. Screenshot: browser downsamples the image on canvas, measures palette
   dominance, saturation, white/dark ratios, corner transparency.
4. Results show verdict badge, top roasts, "fix one thing" tip, itemized
   receipt, evidence list, good-marks section.
5. Optional AI critic (`/api/roast`) adds a 1–2 sentence second opinion.

## UX notes
- Playful, editorial tone; paper background (#f7f7f4), ink text, pink accent.
- Instrument panel animates drifting gradient blobs until a result lands.
- Log lines stream detector hits like lab equipment.
- Mobile: hero stacks, result columns stack.
