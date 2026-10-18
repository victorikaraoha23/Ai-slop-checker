import type { Verdict } from './types';

/* ------------------------------------------------------------------ *
 * Renders a shareable "slop receipt" PNG on a canvas — the visual
 * artifact the Share button hands off (Web Share file, or download).
 * Styled to match the paper/ink/pink forensic-lab design.
 * ------------------------------------------------------------------ */

export interface ReceiptLine {
  title: string;
  points: number;
}

export interface ReceiptData {
  host: string;
  score: number;
  verdict: Verdict;
  lines: ReceiptLine[];
  checkedAt: string;
  kind: 'site' | 'image' | 'text';
}

const INK = '#15140f';
const PAPER = '#fffdf8';
const GREY = '#64635e';
const FAINT = '#ababa7';
const PINK = '#f81a86';
const PINK_DEEP = '#bc1560';

function verdictColor(score: number): string {
  if (score <= 30) return '#2d8a4e';
  if (score <= 45) return '#8a7a00';
  if (score <= 55) return '#c46a00';
  if (score <= 80) return '#bc1560';
  return PINK;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

/** Draw the receipt and return a PNG Blob. */
export async function renderReceiptPng(data: ReceiptData): Promise<Blob> {
  const W = 720;
  const pad = 48;
  const mono = 'ui-monospace, "SF Mono", Menlo, monospace';
  const display = 'system-ui, -apple-system, Segoe UI, sans-serif';

  // Measure to size the height dynamically — layout flows top-down so the
  // footer can never collide with TOTAL SLOP regardless of finding count.
  const lineH = 34;
  const shown = data.lines.slice(0, 9);
  const headerH = 210;
  const moreH = data.lines.length > shown.length ? 26 : 0;
  // Baseline of the "TOTAL SLOP" row (content flow: header + items + total).
  const totalBaseline = 338 + shown.length * lineH + moreH;
  const footerY = totalBaseline + 52;
  const H = Math.max(headerH + 300, footerY + 44);

  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Paper background.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Top pink bar.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, 8);

  // Header.
  let y = pad + 30;
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `600 30px ${display}`;
  ctx.fillText('slop', pad, y);
  const slopW = ctx.measureText('slop').width;
  ctx.fillStyle = PINK;
  ctx.fillText('/', pad + slopW, y);
  ctx.fillStyle = INK;
  ctx.fillText('check', pad + slopW + ctx.measureText('/').width, y);

  ctx.font = `12px ${mono}`;
  ctx.fillStyle = GREY;
  ctx.fillText('SLOP RECEIPT', pad, y + 24);

  // Right-side date.
  ctx.textAlign = 'right';
  ctx.font = `11px ${mono}`;
  ctx.fillStyle = FAINT;
  const date = new Date(data.checkedAt);
  const stamp = isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16).replace('T', ' ');
  if (stamp) ctx.fillText(stamp, W - pad, y + 24);
  ctx.textAlign = 'left';

  // Host.
  y += 54;
  ctx.font = `600 20px ${display}`;
  ctx.fillStyle = INK;
  ctx.fillText(truncate(ctx, data.host, W - pad * 2), pad, y);

  // Score block.
  y += 26;
  const color = verdictColor(data.score);
  ctx.fillStyle = color;
  roundRect(ctx, pad, y, W - pad * 2, 74, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `300 44px ${display}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(data.score), pad + 22, y + 52);
  const scoreW = ctx.measureText(String(data.score)).width;
  ctx.font = `12px ${mono}`;
  ctx.fillText('/100', pad + 30 + scoreW, y + 52);
  ctx.font = `600 18px ${display}`;
  ctx.textAlign = 'right';
  ctx.fillText(data.verdict.label, W - pad - 22, y + 46);
  ctx.textAlign = 'left';

  // Divider.
  y += 74 + 26;
  ctx.strokeStyle = '#d8d6cf';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Line items.
  y += 10;
  ctx.font = `12px ${mono}`;
  ctx.fillStyle = FAINT;
  ctx.fillText('FINDINGS', pad, y + 12);
  y += 28;

  for (const line of shown) {
    ctx.font = `13px ${display}`;
    ctx.fillStyle = INK;
    const title = truncate(ctx, line.title, W - pad * 2 - 70);
    ctx.fillText(title, pad, y + 16);
    ctx.textAlign = 'right';
    ctx.font = `600 13px ${mono}`;
    ctx.fillStyle = PINK_DEEP;
    ctx.fillText(`+${line.points}`, W - pad, y + 16);
    ctx.textAlign = 'left';
    y += lineH;
  }
  if (data.lines.length > shown.length) {
    ctx.font = `11px ${mono}`;
    ctx.fillStyle = FAINT;
    ctx.fillText(`+ ${data.lines.length - shown.length} more`, pad, y + 14);
    y += 26;
  }

  // Total.
  y += 12;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();
  y += 30;
  ctx.font = `700 16px ${display}`;
  ctx.fillStyle = INK;
  ctx.fillText('TOTAL SLOP', pad, y);
  ctx.textAlign = 'right';
  ctx.font = `700 22px ${mono}`;
  ctx.fillStyle = color;
  ctx.fillText(`${data.score}/100`, W - pad, y);
  ctx.textAlign = 'left';

  // Footer — flows after the total (footerY computed from content above).
  ctx.font = `11px ${mono}`;
  ctx.fillStyle = FAINT;
  ctx.fillText('slopcheck — a forensic lab for machine-made content', pad, footerY);
  ctx.fillText('8 text engines · 25 design detectors · nothing stored', pad, footerY + 18);

  // Bottom ink bar.
  ctx.fillStyle = INK;
  ctx.fillRect(0, H - 8, W, 8);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Receipt render failed'))), 'image/png');
  });
}
