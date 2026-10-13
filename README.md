# slopcheck — is it AI slop?

A forensic lab for machine-made content. Four instruments, one verdict:

| Tab | What it does |
|---|---|
| **Site URL** | Builder fingerprints (Lovable, v0, Bolt, Base44, Replit, Same, Create) with verified markers + design-slop heuristics + on-page copy read |
| **AI Text** | 8-engine ensemble (stock phrases, burstiness, vocabulary, echo, readability, predictability, structure, sentiment) with calibrated 0–100 score, quick-score mode, per-paragraph heatmap |
| **Document** | Upload PDF / DOCX / TXT / MD, extract text, run the full engine panel |
| **Screenshot** | Client-side pixel analysis (palette, saturation, voids) — never leaves the browser |

Plus an optional AI second opinion via OpenRouter (`/api/roast`).

Every result ships with an **Improvement Plan** — the findings ranked by
impact, each paired with a concrete fix and an effort tag — plus per-engine
writing tips on text/document runs. So you don't just get roasted, you get a
to-do list.

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

## API shape (standardized)

Every endpoint returns the same envelope:

```jsonc
// success
{ "ok": true,  "data": { /* route payload */ } }
// error
{ "ok": false, "error": "human-readable message" }
```

Guards shared by all routes (`lib/api.ts`):

- **Validation** — strict URL normalization, field size caps (text ≤ 100k,
  URL ≤ 2k, docs ≤ 8 MB), min-length checks.
- **Security** — SSRF guard rejecting private/loopback/link-local hosts on
  both the initial URL and every redirect; findings input sanitized before
  the LLM call; security headers set in `next.config.mjs` (CSP, nosniff,
  frame-options, referrer-policy, permissions-policy, HSTS).
- **Rate limiting** — per-IP, best-effort in-memory window (the money-spending
  `/api/roast` is the tightest).
- **Error-proofing** — no stack traces leak; every failure returns a clean
  `{ ok: false, error }` with a proper status (400/429/500).

## Tests

```bash
npm test         # 14 unit + 19 API checks (no network, no downloads)
npm run test:e2e # Playwright: all four labs in a real browser
npm run build    # production check
```

## Deploy (Vercel)

Push to GitHub, import in Vercel with the Next.js preset — no custom
settings. Optional env vars: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.

