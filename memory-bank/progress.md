# Progress

## Done
- [x] Next.js + TypeScript scaffold (App Router), Vercel-ready config
- [x] Forensic specimen-lab design system (paper/ink/pink; globals/components/lab/result CSS)
- [x] HTML heuristic engine (`lib/analyze.ts`, ~28 detectors across framework/type/color/copy/layout/imagery/seo)
- [x] Client pixel analysis (`lib/image.ts`) — never leaves the browser
- [x] Canvas instrument + score badge (`lib/canvas.ts`)
- [x] 8-engine text ensemble (`lib/text/*`), calibrated 0–100 + heatmap + quick-score
- [x] Builder fingerprints (`lib/site/fingerprints.ts`, verified markers, confirmed/possible)
- [x] API: `/api/site`, `/api/text`, `/api/docs`, `/api/check`, `/api/roast`
- [x] Improvement Plan (`lib/recommend.ts`) — every finding mapped to a concrete, ranked fix + per-engine writing tips
- [x] Shared API layer (`lib/api.ts`) — standardized `{ ok, data }`/`{ ok, error }` envelope, validation, SSRF guard, rate limiting
- [x] Security headers in `next.config.mjs` (CSP, nosniff, frame-options, referrer-policy, permissions-policy, HSTS)
- [x] Tests: `tests/smoke.ts` (14) + `tests/api.test.ts` (19) + Playwright E2E (9)
- [x] Memory bank initialized (brief, product, system, tech, active, progress)

## In progress
- [ ] Vercel deploy (import repo in dashboard or run `vercel --prod`)

## Verified
- [x] `npm test` — 33/33 (14 unit + 19 API), no network
- [x] `npm run test:e2e` — 9/9 in Chromium
- [x] `npm run build` — green, all 5 API routes compiled
- [x] All endpoints return the standardized envelope; bad input → clean 400/429 with a user-safe message
