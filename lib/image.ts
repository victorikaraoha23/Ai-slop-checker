import type { Finding, GoodMark } from './types';
import { fixSuggestion, scoreFindings, verdictFor } from './analyze';

export interface ImageReport {
  findings: Finding[];
  goodMarks: GoodMark[];
  score: number;
  verdict: ReturnType<typeof verdictFor>;
  fix: string;
}

function push(list: Finding[], f: Finding) {
  if (f.points > 0) list.push(f);
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export async function analyzeImageFile(file: File): Promise<ImageReport> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas unavailable in this browser.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const findings: Finding[] = [];
  const goodMarks: GoodMark[] = [];

  // Sample palette + saturation + edges.
  const buckets = new Map<string, number>();
  let satSum = 0;
  let satN = 0;
  let bright = 0;
  let dark = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    satSum += sat;
    satN++;
    const lum = luminance(r, g, b);
    if (lum > 235) bright++;
    if (lum < 18) dark++;
    const key = `${Math.round(r / 32)},${Math.round(g / 32)},${Math.round(b / 32)}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const avgSat = satN ? satSum / satN : 0;
  const total = satN || 1;
  const whiteRatio = bright / total;
  const darkRatio = dark / total;
  const topBucket = [...buckets.values()].sort((a, b) => b - a)[0] ?? 0;
  const dominance = topBucket / total;

  if (whiteRatio > 0.45 && avgSat < 0.2) {
    push(findings, {
      id: 'px-minimal',
      category: 'layout',
      title: 'Vast white void',
      points: 6,
      roast: 'So much whitespace the content filed a missing-persons report.',
      note: `${Math.round(whiteRatio * 100)}% near-white pixels with low saturation. The classic airy generator canvas.`,
      evidence: [{ label: `${Math.round(whiteRatio * 100)}% near-white` }],
    });
  }
  if (dominance > 0.35) {
    push(findings, {
      id: 'px-flat',
      category: 'color',
      title: 'One flat background to rule them all',
      points: 5,
      roast: 'A single flat tone doing all the emotional labor.',
      note: 'One quantized color dominates over a third of sampled pixels.',
      evidence: [{ label: `${Math.round(dominance * 100)}% single-tone dominance` }],
    });
  }
  if (avgSat > 0.42) {
    push(findings, {
      id: 'px-candy',
      category: 'color',
      title: 'Candy-saturated gradients',
      points: 7,
      roast: 'Neon gradients turned up until the pixels begged for mercy.',
      note: `Mean saturation ${avgSat.toFixed(2)} across samples. Generator hero washes run hot like this.`,
      evidence: [{ label: `saturation ${avgSat.toFixed(2)}` }],
    });
  }
  if (darkRatio > 0.45) {
    push(findings, {
      id: 'px-darkmode',
      category: 'color',
      title: 'Default dark-mode drape',
      points: 4,
      roast: 'Dark mode, light effort.',
      note: `${Math.round(darkRatio * 100)}% near-black pixels. Moody default theme energy.`,
      evidence: [{ label: `${Math.round(darkRatio * 100)}% near-black` }],
    });
  }

  // Rounded-corner census: transparent or paper-colored corners suggest cards.
  let cornerScore = 0;
  const corners: Array<[number, number]> = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ];
  for (const [x, y] of corners) {
    const idx = (y * w + x) * 4;
    const a = data[idx + 3];
    if (a < 40) cornerScore += 2;
  }
  if (cornerScore >= 4) {
    push(findings, {
      id: 'px-round',
      category: 'layout',
      title: 'Rounded everything',
      points: 5,
      roast: 'Corners so round the screenshot rolls off the table.',
      note: 'Transparent rounded corners detected on the capture frame.',
      evidence: [{ label: 'rounded capture corners' }],
    });
  }

  if (!findings.length) {
    goodMarks.push({
      title: 'Pixels look opinionated',
      note: 'No dominant generator palette or void detected in this shot.',
    });
  }

  const score = scoreFindings(findings);
  return { findings, goodMarks, score, verdict: verdictFor(score), fix: fixSuggestion(findings) };
}
