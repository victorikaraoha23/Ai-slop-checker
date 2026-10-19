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

async function generateAiAnalysis(host: string, title: string | null, score: number, findings: ReturnType<typeof analyzeHtml>['findings']): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const evidence = findings.slice(0, 10).map((f) => `${f.title}: ${f.note}`).join('\\n');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-slop-checker.vercel.app',
        'X-Title': 'slopcheck',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL?.trim() || 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert web design auditor. Give a concise, evidence-based analysis of whether a website appears machine-generated. Mention the strongest signals, one uncertainty, and the most useful next step. Do not claim certainty from heuristics alone. Return 3 short paragraphs with plain text only.',
          },
          { role: 'user', content: `Site: ${host}\\nTitle: ${title || 'Unknown'}\\nHeuristic score: ${score}/100\\nEvidence:\\n${evidence || 'No suspicious signals detected.'}` },
        ],
        temperature: 0.2,
        max_tokens: 280,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim() ? text.trim().slice(0, 1800) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
    const aiAnalysis = await generateAiAnalysis(host, title, score, findings);
    return jsonOk({
      host,
      findings,
      goodMarks,
      score,
      verdict: verdictFor(score),
      screenshotUrl: screenshotFor(url),
      pageTitle: title,
      aiAnalysis,
      fix: fixSuggestion(findings),
      plan: recommendations(findings),
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return jsonErr(err instanceof Error ? err.message : 'Check failed. Try another URL.');
  }
}
