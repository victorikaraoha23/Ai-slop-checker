import { NextRequest } from 'next/server';
import { asString, clientIp, jsonErr, jsonOk, rateLimit, readJson } from '@/lib/api';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // This endpoint spends money on an LLM call — keep it tight.
    if (!rateLimit(`roast:${clientIp(req)}`, 8)) {
      return jsonErr('The critic is on a break. Try again in a minute.', 429);
    }
    const body = await readJson(req);
    const rawFindings = Array.isArray(body.findings) ? body.findings : [];
    const findings = rawFindings.slice(0, 10).map((f) => ({
      title: asString((f as { title?: unknown })?.title, 80) || 'finding',
      roast: asString((f as { roast?: unknown })?.roast, 200),
    }));
    const host = asString(body.host, 80) || 'this site';
    const score = typeof body.score === 'number' && Number.isFinite(body.score) ? body.score : 0;

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return jsonOk({ opinion: null, disabled: true });

    const summary = findings.map((f) => `- ${f.title}: ${f.roast}`).join('\n');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-slop-checker.vercel.app',
        'X-Title': 'slopcheck',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: 'You are a brutally funny design critic writing one or two sentences. Roast the website based on the findings. No preamble, no lists.' },
          { role: 'user', content: `Site: ${host} (slop score ${score}/100).\n${summary}` },
        ],
        max_tokens: 140,
        temperature: 0.9,
      }),
    });
    if (!res.ok) return jsonOk({ opinion: null, disabled: false });
    const data = await res.json();
    const opinion: string | null = data?.choices?.[0]?.message?.content?.trim() ?? null;
    return jsonOk({ opinion, disabled: false });
  } catch {
    return jsonOk({ opinion: null, disabled: false });
  }
}
