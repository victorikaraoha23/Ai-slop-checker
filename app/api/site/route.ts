import { NextRequest } from 'next/server';
import { analyzeHtml } from '@/lib/analyze';
import { detectBuilders, siteVerdict } from '@/lib/site/fingerprints';
import { analyzeText } from '@/lib/text/ensemble';
import { recommendations } from '@/lib/recommend';
import { jsonErr, jsonOk, normalizeUrl, rateLimit, readJson, clientIp, asString } from '@/lib/api';

export const maxDuration = 30;

async function fetchPage(url: string): Promise<{ html: string; headers: Record<string, string> }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'slopcheck/1.0 (+site-check)' },
      redirect: 'follow',
    });
    // Re-validate the final host after redirects (SSRF via open redirect).
    const finalHost = new URL(res.url || url).hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.)/i.test(finalHost)) {
      throw new Error('Redirect led to a private address — blocked.');
    }
    if (!res.ok) throw new Error(`Fetch returned ${res.status}. The site may block bots.`);
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

async function generateAiAnalysis(host: string, score: number, findings: ReturnType<typeof analyzeHtml>['findings'], text: ReturnType<typeof analyzeText> | null): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const evidence = findings.slice(0, 8).map((f) => `${f.title}: ${f.note}`).join('\\n');
    const copy = text ? `Copy classifier: ${text.verdict}, ${text.score}/100 (${text.confidence} confidence).` : 'No meaningful copy sample.';
    const models = [...new Set([process.env.OPENROUTER_MODEL?.trim(), 'openrouter/free'].filter(Boolean))];
    for (const model of models) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://ai-slop-checker.vercel.app', 'X-Title': 'slopcheck' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are an expert web design auditor. Write 3 short plain-text paragraphs: your evidence-based conclusion, the strongest signals, and one practical next step. Treat heuristic scores as clues, not proof. Do not use markdown headings.' },
            { role: 'user', content: `Site: ${host}\nDesign score: ${score}/100\n${copy}\nEvidence:\n${evidence || 'No suspicious design signals.'}` },
          ], temperature: 0.2, max_tokens: 280,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const output = data?.choices?.[0]?.message?.content;
      if (typeof output === 'string' && output.trim()) return output.trim().slice(0, 1800);
    }
    return null;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`site:${clientIp(req)}`, 20)) {
      return jsonErr('Too many scans right now. Try again in a minute.', 429);
    }
    const body = await readJson(req);
    const url = normalizeUrl(asString(body.url, 2048));
    const host = new URL(url).hostname.replace(/^www\./, '');
    const includeText = body.include_text !== false;

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

    const aiAnalysis = await generateAiAnalysis(host, designScore, findings, textAnalysis);

    return jsonOk({
      host,
      url,
      site: { builders, verdict: siteVerdict(builders) },
      design: { score: designScore, findings, goodMarks },
      text: textAnalysis,
      aiAnalysis,
      plan: recommendations(findings),
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return jsonErr(err instanceof Error ? err.message : 'Site scan failed.');
  }
}
