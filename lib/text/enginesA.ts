import type { Engine } from './engine';

const STOCK = [
  'delve', 'unlock', 'unleash', 'elevate', 'supercharge', 'seamless',
  'game-changer', 'revolutionize', 'cutting-edge', 'next-level', 'empower',
  'streamline', 'robust', 'leverage', 'all-in-one', 'furthermore', 'moreover',
  'in conclusion', 'it is important to note', 'tapestry', 'landscape',
  'realm', 'pivotal', 'crucial', 'testament',
];

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

export const stockPhrases: Engine = {
  name: 'Stock Phrase Census',
  code: 'SP',
  kind: 'linguistic',
  describe: 'Counts AI-favorite clichés per thousand words.',
  run(text) {
    const w = words(text);
    const per = w.length ? 1000 / w.length : 0;
    let hits = 0;
    const found: string[] = [];
    const low = text.toLowerCase();
    for (const p of STOCK) {
      const n = low.split(p).length - 1;
      if (n > 0) { hits += n; if (found.length < 5) found.push(p); }
    }
    const density = hits * per;
    const score = Math.min(1, density / 14);
    return {
      score,
      details: hits === 0
        ? 'No stock AI phrases found.'
        : `${hits} stock phrase(s) (${density.toFixed(1)}/1k words): ${found.join(', ')}`,
    };
  },
};

export const burstiness: Engine = {
  name: 'Burstiness Meter',
  code: 'BU',
  kind: 'statistical',
  describe: 'Human writing varies sentence length; flat rhythm reads machine-made.',
  run(text) {
    const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 3);
    if (sentences.length < 4) return { score: 0, details: 'Needs at least 4 sentences.' };
    const lens = sentences.map((s) => s.split(/\s+/).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
    const cv = mean ? Math.sqrt(variance) / mean : 0;
    // Measured behavior: human prose CV ~0.5-0.9, AI ~0.25-0.45.
    const score = Math.max(0, Math.min(1, (0.62 - cv) / 0.4));
    return { score, details: `Sentence-length CV ${cv.toFixed(2)} across ${sentences.length} sentences (lower = flatter).` };
  },
};

export const vocabulary: Engine = {
  name: 'Vocabulary Richness',
  code: 'VO',
  kind: 'linguistic',
  describe: 'Type-token ratio: recycled words suggest autocomplete prose.',
  run(text) {
    const w = words(text).filter((x) => x.length > 2);
    if (w.length < 60) return { score: 0, details: 'Needs at least ~60 words.' };
    const ttr = new Set(w).size / w.length;
    const score = Math.max(0, Math.min(1, (0.62 - ttr) / 0.3));
    return { score, details: `Type-token ratio ${ttr.toFixed(2)} over ${w.length} words.` };
  },
};

export const repetition: Engine = {
  name: 'Echo Detector',
  code: 'EC',
  kind: 'structural',
  describe: 'Flags repeated n-grams and mirrored sentence openers.',
  run(text) {
    const w = words(text);
    if (w.length < 80) return { score: 0, details: 'Needs at least ~80 words.' };
    const grams = new Map<string, number>();
    for (let i = 0; i + 3 < w.length; i++) {
      const g = w.slice(i, i + 4).join(' ');
      grams.set(g, (grams.get(g) ?? 0) + 1);
    }
    let repeats = 0;
    for (const n of grams.values()) if (n > 1) repeats += n - 1;
    const rate = repeats / Math.max(1, grams.size);
    const openers = new Map<string, number>();
    for (const s of text.split(/[.!?]+/)) {
      const first = (s.trim().split(/\s+/)[0] ?? '').toLowerCase();
      if (first.length > 2) openers.set(first, (openers.get(first) ?? 0) + 1);
    }
    const topOpener = Math.max(0, ...openers.values());
    const score = Math.min(1, rate * 22 + Math.max(0, topOpener - 3) * 0.12);
    return { score, details: `${repeats} repeated 4-grams; most common sentence opener used ${topOpener}x.` };
  },
};
