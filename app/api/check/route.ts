import { NextRequest } from 'next/server';
import { analyzeHtml, fixSuggestion, scoreFindings, verdictFor } from '@/lib/analyze';
import { recommendations } from '@/lib/recommend';
import { asString, clientIp, jsonErr, jsonOk, normalizeUrl, rateLimit, readJson } from '@/lib/api';

export const maxDuration = 30;

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
    if (!rateLimit(`check:${clientIp(req)}`, 20)) {
      return jsonErr('Too many checks right now. Try again in a minute.', 429);
    }
    const body = await readJson(req);
    const url = normalizeUrl(asString(body.url, 2048));
    const host = new URL(url).hostname.replace(/^www\./, '');
    const { html, text, title } = await fetchHtml(url);
    const { findings, goodMarks } = analyzeHtml(html, text);
    const score = scoreFindings(findings);
    return jsonOk({
      host,
      findings,
      goodMarks,
      score,
      verdict: verdictFor(score),
      screenshotUrl: screenshotFor(url),
      pageTitle: title,
      fix: fixSuggestion(findings),
      plan: recommendations(findings),
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return jsonErr(err instanceof Error ? err.message : 'Check failed. Try another URL.');
  }
}
