import { engineLabel, wrap, type Engine, type TextAnalysis } from './engine';
import { stockPhrases, burstiness, vocabulary, repetition } from './enginesA';
import { readability, perplexityProxy, structural, sentiment } from './enginesB';

export const TEXT_ENGINES: Engine[] = [
  stockPhrases, burstiness, vocabulary, repetition,
  readability, perplexityProxy, structural, sentiment,
];

const WEIGHTS = [0.26, 0.15, 0.1, 0.1, 0.07, 0.11, 0.14, 0.07];

export function analyzeText(raw: string): TextAnalysis {
  const text = raw.replace(/\r/g, '').slice(0, 100_000);
  const wordCount = (text.match(/\S+/g) ?? []).length;
  const engines = TEXT_ENGINES.map((e) => wrap(e, text));
  // Engines that abstain (score 0 with a "too short"/skip note) don't vote:
  // renormalize weights over voting engines only.
  const voting = engines.map((r, i) =>
    r.score === 0 && /too short|skipped/i.test(r.details) ? 0 : (WEIGHTS[i] ?? 0.1),
  );
  const wSum = voting.reduce((a, b) => a + b, 0) || 1;
  const weighted = engines.reduce((sum, r, i) => sum + r.score * (voting[i] ?? 0), 0) / wSum;
  // Short-text pull toward neutral (mirrors SlopTotal's short-text adjustment).
  const pull = wordCount < 80 ? wordCount / (wordCount + 40) : 1;
  const score = Math.round(Math.max(0, Math.min(100, weighted * 100 * pull + 50 * (1 - pull))));
  const verdict = score <= 30 ? 'Clean — likely human-written'
    : score <= 45 ? 'Low risk'
    : score <= 55 ? 'Suspicious'
    : score <= 80 ? 'Likely AI-generated'
    : 'Slop detected';
  const confidence: TextAnalysis['confidence'] =
    wordCount < 80 || (score > 35 && score < 65) ? 'low'
    : score <= 15 || score >= 80 ? 'high' : 'medium';
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).slice(0, 24);
  const paragraphs = paras.map((p, index) => {
    const r = wrap(stockPhrases, p);
    const r2 = wrap(burstiness, p.length > 200 ? p : p + ' ' + p);
    const s = Math.round(((r.score + r2.score) / 2) * 100);
    return {
      index, score: s,
      label: s <= 35 ? 'clean' : s <= 65 ? 'mixed' : 'ai',
      preview: p.slice(0, 140) + (p.length > 140 ? '…' : ''),
    };
  });
  return {
    score, verdict, confidence,
    enginesFlagged: engines.filter((e) => e.score >= 0.65).length,
    enginesTotal: engines.length,
    engines, wordCount,
    language: /\b(the|and|of|to)\b/i.test(text) ? 'en' : 'other',
    paragraphs,
  };
}

export function quickScore(raw: string): { score: number; label: string } {
  const a = analyzeText(raw.slice(0, 4000));
  return { score: a.score, label: a.score <= 35 ? 'clean' : a.score <= 65 ? 'mixed' : 'ai' };
}

export { engineLabel };
