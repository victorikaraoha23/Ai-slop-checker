import { NextRequest, NextResponse } from 'next/server';
import { analyzeText, quickScore } from '@/lib/text/ensemble';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.snippets)) {
      const out = (body.snippets as Array<{ id?: string; text?: string }>).slice(0, 20).map((s, i) => {
        const q = quickScore(String(s?.text ?? ''));
        return { id: s?.id ?? `snippet-${i}`, ...q, confidence: q.score <= 35 || q.score >= 65 ? 'high' : 'low' };
      });
      return NextResponse.json({ results: out });
    }
    const text = typeof body?.text === 'string' ? body.text : '';
    if (text.trim().length < 50) {
      return NextResponse.json({ error: 'Paste at least ~50 characters for a reliable read.' }, { status: 400 });
    }
    const mode = body?.mode === 'quick' ? 'quick' : 'full';
    if (mode === 'quick') {
      const q = quickScore(text);
      return NextResponse.json({ mode, ...q });
    }
    return NextResponse.json({ mode, ...analyzeText(text) });
  } catch {
    return NextResponse.json({ error: 'Text analysis failed.' }, { status: 500 });
  }
}
