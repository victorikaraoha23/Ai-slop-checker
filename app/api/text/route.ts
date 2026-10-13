import { NextRequest } from 'next/server';
import { analyzeText, quickScore } from '@/lib/text/ensemble';
import { asString, clientIp, jsonErr, jsonOk, rateLimit, readJson } from '@/lib/api';

export const maxDuration = 30;
const MAX_TEXT = 100_000;

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`text:${clientIp(req)}`, 40)) {
      return jsonErr('Too many requests. Slow down for a minute.', 429);
    }
    const body = await readJson(req);

    // Batch snippet mode (extension API).
    if (Array.isArray(body.snippets)) {
      const out = (body.snippets as Array<{ id?: unknown; text?: unknown }>)
        .slice(0, 20)
        .map((s, i) => {
          const q = quickScore(asString(s?.text, 4000));
          return { id: typeof s?.id === 'string' ? s.id : `snippet-${i}`, ...q, confidence: q.score <= 35 || q.score >= 65 ? 'high' : 'low' };
        });
      return jsonOk({ results: out });
    }

    const text = asString(body.text, MAX_TEXT);
    if (text.trim().length < 50) {
      return jsonErr('Paste at least ~50 characters for a reliable read.');
    }
    const mode = body.mode === 'quick' ? 'quick' : 'full';
    if (mode === 'quick') {
      return jsonOk({ mode, ...quickScore(text) });
    }
    return jsonOk({ mode, ...analyzeText(text) });
  } catch {
    return jsonErr('Text analysis failed.', 500);
  }
}
