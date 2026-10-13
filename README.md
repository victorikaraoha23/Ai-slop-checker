# slopcheck — is your website AI slop?

A field instrument for machine-made websites. Paste a link or drop a
screenshot; the app reads the markup and the pixels, then tells you exactly
what the robots left behind — with a 0–100 score, roasts, a slop receipt,
and an evidence report.

> Original implementation inspired by the genre. All code and copy here are
> written fresh for this repo.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript — frontend and backend
- Hand-written CSS, canvas instrument animation
- `POST /api/check` — fetches readable markup via text proxy, runs ~20
  heuristic detectors, returns score + findings + screenshot preview
- `POST /api/roast` — optional OpenRouter second opinion (needs API key)
- Screenshot mode runs fully in the browser (pixels never leave the device)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.
