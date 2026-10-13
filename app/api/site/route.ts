import { NextRequest, NextResponse } from 'next/server';
import { analyzeHtml } from '@/lib/analyze';
import { detectBuilders, siteVerdict } from '@/lib/site/fingerprints';
import { analyzeText } from '@/lib/text/ensemble';

export const maxDuration = 30;

function normalizeUrl(input: string): string {
  let v = input.trim();
  if (!v) throw new Error('Enter a URL first.');
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  const u = new URL(v);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http(s) URLs are supported.');
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname)) {
    throw new Error('Private network addresses are blocked.');
  }
  return u.toString();
}

async function fetchPage(url: string): Promise<{ html: string; headers: Record<string, string> }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'slopcheck/1.0 (+site-check)' },
      redirect: 'follow',
    });
    const finalHost = new URL(res.url || url).hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(finalHost)) {
      throw new Error('Redirect led to a private address — blocked.');
    }
    if (!res.ok) throw new Error(`Fetch returned ${res.status}.`);
    const html = (await res.text()).slice(0, 600_000);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { html, headers };
  } finally {
    clearTimeout(t);
  }
}

function mainContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20_000);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.url === 'string' ? body.url : '';
    const url = normalizeUrl(raw);
    const host = new URL(url).hostname.replace(/^www\./, '');
    const includeText = body?.include_text !== false;

    const { html, headers } = await fetchPage(url);
    const builders = detectBuilders(html, headers);
    const { findings, goodMarks } = analyzeHtml(html);
    const points = findings.reduce((s, f) => s + f.points, 0);
    const designScore = Math.max(0, Math.min(100, points));

    let textAnalysis: ReturnType<typeof analyzeText> | null = null;
    if (includeText) {
      const copy = mainContent(html);
      if (copy.split(/\s+/).length >= 12) textAnalysis = analyzeText(copy);
    }

    return NextResponse.json({
      host,
      url,
      site: { builders, verdict: siteVerdict(builders) },
      design: { score: designScore, findings, goodMarks },
      text: textAnalysis,
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Site scan failed.' }, { status: 400 });
  }
}
