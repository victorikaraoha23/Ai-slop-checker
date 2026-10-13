# Progress

## Done
- [x] Next.js + TypeScript scaffold (package.json, tsconfig, next.config)
- [x] Vercel config + gitignore
- [x] Types (`lib/types.ts`)
- [x] HTML heuristic engine (`lib/analyze.ts`, ~20 detectors)
- [x] Client pixel analysis (`lib/image.ts`)
- [x] Canvas instrument + score badge (`lib/canvas.ts`)
- [x] `POST /api/check` route (proxy fetch + analyze + score)
- [x] `POST /api/roast` route (OpenRouter critic, optional)
- [x] UI: layout, globals/result CSS, CheckerForm, ShotUploader, ResultView
- [x] Favicon asset
- [x] Memory bank initialized (brief, product, system, tech, active)

## In progress
- [ ] Vercel deploy (import repo in dashboard or run `vercel --prod`)

## Verified
- [x] README + .env.example
- [x] `npm install` + production build check (green)
- [x] Commit `32b4cd4` pushed to origin/main
