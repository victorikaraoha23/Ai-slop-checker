# slopcheck — is it AI slop?

A forensic lab for machine-made content. Four instruments, one verdict:

| Tab | What it does |
|---|---|
| **Site URL** | Builder fingerprints (Lovable, v0, Bolt, Base44, Replit, Same, Create) with verified markers + design-slop heuristics + on-page copy read |
| **AI Text** | 8-engine ensemble (stock phrases, burstiness, vocabulary, echo, readability, predictability, structure, sentiment) with calibrated 0–100 score, quick-score mode, per-paragraph heatmap |
| **Document** | Upload PDF / DOCX / TXT / MD, extract text, run the full engine panel |
| **Screenshot** | Client-side pixel analysis (palette, saturation, voids) — never leaves the browser |

Plus an optional AI second opinion via OpenRouter (`/api/roast`).

> Method notes: text-engine design and verdict bands (30/45/55/80), the
> short-text neutral pull, and the builder-fingerprint verification method
> follow the research published with SlopTotal (MIT-licensed,
> pablocaeg/sloptotal). All code and copy here are original implementations.
> Neural-model engines from that project are intentionally not ported — this
> app runs fully on serverless with zero model weight downloads.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript — frontend and backend
- Hand-written CSS, canvas instrument animation
- API: `/api/site`, `/api/text`, `/api/docs`, `/api/check`, `/api/roast`
- Tests: `npm test` (14 fast checks, no network, no downloads)

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # smoke suite
npm run build    # production check
```

## Deploy (Vercel)

Push to GitHub, import in Vercel with the Next.js preset — no custom
settings. Optional env vars: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.

