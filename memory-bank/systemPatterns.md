# System Patterns

## Architecture
- `app/page.tsx` — client home page, orchestrates tabs, fetch, results.
- `components/` — `CheckerForm`, `ShotUploader`, `ResultView`.
- `lib/types.ts` — Finding / GoodMark / Verdict / CheckResult shapes.
- `lib/analyze.ts` — server-safe HTML heuristic engine + scoring.
- `lib/image.ts` — client-side pixel analysis (canvas sampling).
- `lib/canvas.ts` — blob-field instrument animation + score badge art.
- `app/api/check/route.ts` — URL normalize, proxy fetch, analyze, score.
- `app/api/roast/route.ts` — OpenRouter critic, optional, fail-open.

## Key decisions
- Heuristics over ML: fast, explainable, no model hosting.
- Score = clamped sum of finding points (0–100); verdict bands at
  15 / 35 / 55 / 75.
- Link pipeline depends on `r.jina.ai` readability proxy; 18s timeout.
- Screenshot pipeline is fully local: `createImageBitmap` + 480px canvas.
- Preview images for URLs via `image.thum.io` (no key, client-rendered).
- No database, no cookies, no tracking.

## Conventions
- TypeScript strict, App Router, client components marked explicitly.
- Keep detectors additive: new Finding = id + category + points + roast.
