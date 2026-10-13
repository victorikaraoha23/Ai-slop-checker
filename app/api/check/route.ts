import { NextRequest, NextResponse } from 'next/server';
import { analyzeHtml, fixSuggestion, scoreFindings, verdictFor } from '@/lib/analyze';

export const maxDuration = 30;

function normalizeUrl(input: string): string {
  let v = input.trim();
  if (!v) throw new Error('Enter a URL first.');
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  const u = new URL(v);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http(s) URLs are supported.');
  return u.toString();
}

async function fetchHtml(url: string): Promise<{ html: string; text: string; title: string | null }> {
  const target = 'https://r.jina.ai/' + url;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 18000);
  try {
    const res = await fetch(target, {
      signal: ctrl.signal,
      headers: { 'X-Return-Format': 'html', 'User-Agent': 'slopcheck/1.0' },
    });
    if (!res.ok) throw new Error(`Reader returned ${res.status}. The site may block bots.`);
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]{1,120})<\/title>/i)?.[1]?.trim() ?? null;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 60000);
    return { html: html.slice(0, 600000), text, title };
  } finally {
    clearTimeout(t);
  }
}

function screenshotFor(url: string): string {
  return `https://image.thum.io/get/width/1200/crop/900/noanimate/${encodeURIComponent(url)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.url === 'string' ? body.url : '';
    const url = normalizeUrl(raw);
    const host = new URL(url).hostname.replace(/^www\./, '');
    const { html, text, title } = await fetchHtml(url);
    const { findings, goodMarks } = analyzeHtml(html, text);
    const score = scoreFindings(findings);
    return NextResponse.json({
      host,
      findings,
      goodMarks,
      score,
      verdict: verdictFor(score),
      screenshotUrl: screenshotFor(url),
      pageTitle: title,
      fix: fixSuggestion(findings),
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Check failed. Try another URL.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
