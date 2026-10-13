# Project Brief — AI Slop Checker

## What this is
A playful "field instrument" web app that inspects websites for tell-tale
AI-generated design patterns. Users paste a URL or drop a screenshot and get
a scored verdict (0–100), roasts, a slop receipt, and an evidence report.

## Goals
- Next.js 14 (App Router) full-stack app, deployable to Vercel as-is.
- Frontend: hero with Link/Screenshot tabs, animated instrument canvas,
  verdict + receipt + evidence sections.
- Backend: `POST /api/check` (fetch markup via text proxy, run heuristics,
  return score) and `POST /api/roast` (optional OpenRouter second opinion).
- Screenshot mode runs fully client-side (pixels never leave the browser).
- Original code and copy throughout — inspired by the genre, not copied.

## Scope boundaries
- Not science: heuristic pattern matching, clearly labeled as such.
- Nothing is stored server-side; no DB, no auth.
- AI critic requires `OPENROUTER_API_KEY`, otherwise the app degrades
  gracefully to built-in verdict summaries.
