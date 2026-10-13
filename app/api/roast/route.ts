import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const findings = Array.isArray(body?.findings) ? body.findings : [];
    const host = typeof body?.host === 'string' ? body.host : 'this site';
    const score = typeof body?.score === 'number' ? body.score : 0;
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ opinion: null, disabled: true });
    }
    const summary = findings
      .slice(0, 10)
      .map((f: { title?: string; roast?: string }) => `- ${f.title ?? 'finding'}: ${f.roast ?? ''}`)
      .join('\n');
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
          {
            role: 'system',
            content:
              'You are a brutally funny design critic writing one or two sentences. Roast the website based on the findings. No preamble, no lists.',
          },
          { role: 'user', content: `Site: ${host} (slop score ${score}/100).\n${summary}` },
        ],
        max_tokens: 140,
        temperature: 0.9,
      }),
    });
    if (!res.ok) return NextResponse.json({ opinion: null, disabled: false });
    const data = await res.json();
    const opinion: string | null = data?.choices?.[0]?.message?.content?.trim() ?? null;
    return NextResponse.json({ opinion, disabled: false });
  } catch {
    return NextResponse.json({ opinion: null, disabled: false });
  }
}
