# AI Slop Checker

**A web-based content and website analysis tool.** AI Slop Checker examines text, documents, screenshots, and websites for signals associated with low-quality or machine-generated content. It presents evidence and practical improvement suggestions rather than treating a heuristic score as proof of authorship.

- **Live website:** https://ai-slop-checker-five.vercel.app/
- **Source:** https://github.com/victorikaraoha23/Ai-slop-checker
- **Status:** Live

## What it does

| Analysis mode | Current capability |
| --- | --- |
| Website URL | Detects supported website-builder fingerprints, evaluates design and copy signals, and can return an optional AI-generated second opinion |
| Text | Runs an eight-engine heuristic ensemble covering stock phrases, burstiness, vocabulary, repetition, readability, predictability, structure, and sentiment |
| Documents | Extracts text from PDF, DOCX, TXT, and Markdown files before running the text analysis |
| Screenshot | Performs client-side visual-signal analysis; screenshot pixels are processed in the browser |

Text analysis includes a quick-score mode, per-paragraph indicators, confidence labels, and an improvement plan. The site analysis can also produce an improvement plan that ranks findings by impact and pairs them with suggested fixes.

## How the analysis is designed

The text classifier combines weighted signals from eight separate heuristic engines. It adjusts short-text scores toward neutral and lowers confidence when the sample is short or the score is ambiguous. Website analysis combines HTML/design heuristics with a separate builder-fingerprint check. An optional OpenRouter call can provide a second opinion for website findings.

These signals are intended to support review, not replace it. AI-detection methods can produce false positives and false negatives; a score alone cannot establish who wrote a piece of content.

## Technical implementation

- Next.js App Router, React, and TypeScript
- Server-side API routes for website, text, document, and auxiliary checks
- PDF text extraction with the legacy PDF.js build
- DOCX extraction with Mammoth
- Client-side screenshot pixel analysis
- Optional OpenRouter integration for a second opinion
- Shared JSON success/error response envelope
- Input validation, request-size limits, rate limits, and SSRF protections for URL fetching
- Security headers configured for the application

The site-analysis route re-validates the destination after redirects to reduce redirect-based SSRF risk. Document uploads are limited to 8 MB, and supported document formats are explicitly checked.

## Local development

Requirements: Node.js 18.18 or newer and npm.

```bash
git clone https://github.com/victorikaraoha23/Ai-slop-checker.git
cd Ai-slop-checker
npm install
npm run dev
```

Open http://localhost:3000.

Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Enables the optional AI second opinion |
| `OPENROUTER_MODEL` | Overrides the configured OpenRouter model |

Keep API keys in local environment configuration or your deployment provider. Never commit secrets.

## Verification

```bash
npm test
npm run test:e2e
npm run build
```

The repository includes unit/API checks and Playwright end-to-end tests. Run the commands above in your local environment to verify the current checkout.

## Scope and limitations

- Results are heuristic indicators, not proof of AI authorship or content quality.
- Very short samples provide weaker evidence and are deliberately pulled toward a neutral score.
- Scanned or image-only PDFs do not contain an extractable text layer and are not supported by the document text-extraction path.
- The optional AI second opinion depends on a configured OpenRouter key and provider availability.
- No accuracy, user-count, or performance benchmark is claimed here.

## Attribution

The repository's method notes reference research published with [SlopTotal](https://github.com/pablocaeg/sloptotal), including its short-text adjustment and builder-fingerprint research. This application is an independent implementation; it does not claim ownership of that upstream research.
