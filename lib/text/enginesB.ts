import type { Engine } from './engine';

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '');
  let n = 0;
  let prev = false;
  for (const ch of w) {
    const v = 'aeiouy'.includes(ch);
    if (v && !prev) n++;
    prev = v;
  }
  return Math.max(1, n);
}

export const readability: Engine = {
  name: 'Readability Uniformity',
  code: 'RU',
  kind: 'linguistic',
  describe: 'Cross-paragraph Flesch consistency; machines hold one register.',
  run(text) {
    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.split(/\s+/).length >= 30);
    const chunks = paras.length >= 3 ? paras : (() => {
      const w = text.split(/\s+/);
      const size = Math.max(40, Math.floor(w.length / 4));
      const out: string[] = [];
      for (let i = 0; i < w.length; i += size) out.push(w.slice(i, i + size).join(' '));
      return out.filter((c) => c.split(/\s+/).length >= 30);
    })();
    if (chunks.length < 3) return { score: 0, details: 'Needs at least 3 paragraphs.' };
    const eases = chunks.map((c) => {
      const sents = c.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length >= 3);
      const ws = (c.match(/[a-zA-Z]+/g) ?? []).length;
      const syl = (c.match(/[a-zA-Z]+/g) ?? []).reduce((a, x) => a + syllables(x), 0);
      if (!sents.length || !ws) return 60;
      return 206.835 - 1.015 * (ws / sents.length) - 84.6 * (syl / ws);
    });
    const mean = eases.reduce((a, b) => a + b, 0) / eases.length;
    const sd = Math.sqrt(eases.reduce((a, b) => a + (b - mean) ** 2, 0) / eases.length);
    const cv = mean !== 0 ? sd / Math.abs(mean) : 0;
    const score = Math.max(0, Math.min(1, (cv - 0.35) / 0.95));
    return { score, details: `Flesch CV ${cv.toFixed(2)} across ${chunks.length} sections (higher = machine-steady).` };
  },
};

export const perplexityProxy: Engine = {
  name: 'Predictability Scan',
  code: 'PX',
  kind: 'statistical',
  describe: 'Common-word density: the most guessable word in every slot.',
  run(text) {
    const COMMON = new Set('the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were has had have been will would should could important however often always never very really significant specific general various numerous'.split(' '));
    const w = text.toLowerCase().match(/[a-z']+/g) ?? [];
    if (w.length < 60) return { score: 0, details: 'Needs at least ~60 words.' };
    const common = w.filter((x) => COMMON.has(x)).length / w.length;
    const score = Math.max(0, Math.min(1, (common - 0.42) / 0.22));
    return { score, details: `${Math.round(common * 100)}% of words are top-frequency fillers.` };
  },
};

export const structural: Engine = {
  name: 'Structure Audit',
  code: 'SA',
  kind: 'structural',
  describe: 'Listicles, em-dash chains, triplet rhythms, hedging tics.',
  run(text) {
    let points = 0;
    const notes: string[] = [];
    const lists = (text.match(/(^|\n)\s*(?:[-*•\d]+\.|[-*•])\s+/g) ?? []).length;
    if (lists >= 3) { points += 0.3; notes.push(`${lists} list markers`); }
    const dashes = (text.match(/—| -- /g) ?? []).length;
    const per1k = dashes / Math.max(1, text.split(/\s+/).length) * 1000;
    if (per1k > 3) { points += 0.25; notes.push('em-dash chains'); }
    const triplets = (text.match(/[^,;]+,[^,;]+, and [^.]+/g) ?? []).length;
    if (triplets >= 2) { points += 0.2; notes.push('triplet rhythms'); }
    const hedges = (text.toLowerCase().match(/\b(it('s| is) worth noting|in today'?s|additionally|lastly|overall,)\b/g) ?? []).length;
    if (hedges >= 2) { points += 0.25; notes.push('hedging tics'); }
    return { score: Math.min(1, points), details: notes.length ? `Found: ${notes.join('; ')}.` : 'No structural tics found.' };
  },
};

export const sentiment: Engine = {
  name: 'Sentiment Flatline',
  code: 'SE',
  kind: 'linguistic',
  describe: 'Paragraph-to-paragraph sentiment variance; AI stays agreeable.',
  run(text) {
    const POS = new Set('great excellent amazing wonderful fantastic love best brilliant outstanding impressive remarkable powerful innovative success happy benefit advantage opportunity growth enjoy like good better strong positive'.split(' '));
    const NEG = new Set('bad terrible awful horrible hate worst fail failure poor weak problem issue risk threat loss bad difficult hard wrong negative concern lack'.split(' '));
    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (paras.length < 3) return { score: 0, details: 'Needs at least 3 paragraphs.' };
    const vals = paras.map((p) => {
      const w = p.toLowerCase().match(/[a-z]+/g) ?? [];
      if (!w.length) return 0;
      const pos = w.filter((x) => POS.has(x)).length;
      const neg = w.filter((x) => NEG.has(x)).length;
      return (pos - neg) / w.length;
    });
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    const score = Math.max(0, Math.min(1, (0.03 - sd) / 0.025));
    return { score, details: `Sentiment stdev ${sd.toFixed(3)} across ${paras.length} paragraphs.` };
  },
};
