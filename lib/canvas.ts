export function drawBlobField(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const g2d: CanvasRenderingContext2D = ctx;
  let raf = 0;
  let t = 0;
  const blobs = [
    { x: 0.3, y: 0.35, r: 0.28, c: '248,26,134', a: 0.32 },
    { x: 0.7, y: 0.3, r: 0.22, c: '124,58,237', a: 0.3 },
    { x: 0.55, y: 0.7, r: 0.3, c: '56,189,248', a: 0.26 },
    { x: 0.2, y: 0.75, r: 0.2, c: '251,191,36', a: 0.22 },
  ];
  function frame() {
    t += 0.012;
    const w = (canvas.width = canvas.clientWidth * 2);
    const h = (canvas.height = canvas.clientHeight * 2);
    g2d.clearRect(0, 0, w, h);
    g2d.fillStyle = '#efeee9';
    g2d.fillRect(0, 0, w, h);
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const cx = (b.x + Math.sin(t + i * 1.7) * 0.03) * w;
      const cy = (b.y + Math.cos(t * 1.2 + i * 2.1) * 0.03) * h;
      const r = b.r * Math.min(w, h) * 2;
      const g = g2d.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${b.c},${b.a})`);
      g.addColorStop(1, `rgba(${b.c},0)`);
      g2d.fillStyle = g;
      g2d.beginPath();
      g2d.arc(cx, cy, r, 0, Math.PI * 2);
      g2d.fill();
    }
    g2d.strokeStyle = 'rgba(21,20,15,0.16)';
    g2d.lineWidth = 2;
    g2d.strokeRect(8, 8, w - 16, h - 16);
    raf = requestAnimationFrame(frame);
  }
  frame();
  return () => cancelAnimationFrame(raf);
}

export function drawScoreBadge(canvas: HTMLCanvasElement, score: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const s = 520;
  canvas.width = s;
  canvas.height = s;
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = '#15140f';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f81a86';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 34, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * score) / 100);
  ctx.stroke();
  ctx.fillStyle = '#f7f7f4';
  ctx.textAlign = 'center';
  ctx.font = '300 150px system-ui, sans-serif';
  ctx.fillText(String(score), s / 2, s / 2 + 40);
  ctx.font = '28px ui-monospace, monospace';
  ctx.fillStyle = '#ababa7';
  ctx.fillText('/ 100 SLOP', s / 2, s / 2 + 110);
}
