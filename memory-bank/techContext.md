# Tech Context

- Framework: Next.js 14.2 (App Router), React 18, TypeScript 5.
- No CSS framework; hand-written CSS in `app/globals.css` + `result.css`.
- Fonts: system stack (drop Google Fonts link in `layout.tsx` to match
  Bricolage/Martian Mono vibe, optional).
- Runtime: Node >= 18.18. Vercel `maxDuration = 30` on API routes.
- Env vars (all optional):
  - `OPENROUTER_API_KEY` — enables AI critic.
  - `OPENROUTER_MODEL` — default `meta-llama/llama-3.3-70b-instruct:free`.
- Dev: `npm run dev`. Build: `npm run build`. Start: `npm start`.
- Deploy: push to GitHub, import in Vercel, framework preset Next.js,
  no custom build command needed. Add env vars in Vercel dashboard.
