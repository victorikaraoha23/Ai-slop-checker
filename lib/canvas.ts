/**
 * Idle "specimen" visualization. Instead of a static gradient, this renders
 * an active forensic-instrument scan: a constellation of drifting sensor
 * nodes that light up and connect when close, a slow horizontal scanline
 * sweeping the frame, faint grid ticks, and drifting specks. Purely
 * decorative — it communicates "instrument armed, awaiting specimen".
 */
export function drawBlobField(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const g2d: CanvasRenderingContext2D = ctx;
  let raf = 0;
  let t = 0;
  let w = 0;
  let h = 0;

  // Drifting sensor nodes (normalized coords + per-node drift phase).
  const NODES = 26;
  const nodes = Array.from({ length: NODES }, (_, i) => ({
    bx: (i * 2654435761 % 1000) / 1000,
    by: ((i * 40503 + 137) % 1000) / 1000,
    ph: (i % 7) * 1.13,
    sp: 0.4 + ((i * 37) % 60) / 100,
    r: 1.4 + ((i * 13) % 5) * 0.35,
  }));

  // Static specks for depth.
  const SPECKS = 40;
  const specks = Array.from({ length: SPECKS }, (_, i) => ({
    x: (i * 97 % 1000) / 1000,
    y: (i * 53 % 1000) / 1000,
    a: 0.05 + ((i * 7) % 10) / 100,
  }));

  function resize() {
    w = canvas.width = Math.max(1, canvas.clientWidth * 2);
    h = canvas.height = Math.max(1, canvas.clientHeight * 2);
  }
  resize();

  function frame() {
    t += 0.006;
    g2d.clearRect(0, 0, w, h);

    // Paper base with a soft pink bloom at the top.
    g2d.fillStyle = '#efeee9';
    g2d.fillRect(0, 0, w, h);
    const bloom = g2d.createRadialGradient(w * 0.5, -h * 0.2, 0, w * 0.5, -h * 0.2, h * 1.1);
    bloom.addColorStop(0, 'rgba(248,26,134,0.14)');
    bloom.addColorStop(1, 'rgba(248,26,134,0)');
    g2d.fillStyle = bloom;
    g2d.fillRect(0, 0, w, h);

    // Faint grid ticks.
    g2d.strokeStyle = 'rgba(21,20,15,0.05)';
    g2d.lineWidth = 1;
    const step = 48;
    g2d.beginPath();
    for (let x = step; x < w; x += step) { g2d.moveTo(x, 0); g2d.lineTo(x, h); }
    for (let y = step; y < h; y += step) { g2d.moveTo(0, y); g2d.lineTo(w, y); }
    g2d.stroke();

    // Drifting specks.
    for (const s of specks) {
      const sx = (s.x + Math.sin(t * 0.6 + s.y * 9) * 0.01) * w;
      const sy = (s.y + t * 0.01 * (s.x > 0.5 ? 1 : -1)) % 1 * h;
      g2d.fillStyle = `rgba(21,20,15,${s.a})`;
      g2d.fillRect(sx, sy, 2, 2);
    }

    // Compute node positions.
    const pts = nodes.map((n, i) => ({
      x: (n.bx + Math.sin(t * n.sp + n.ph) * 0.045) * w,
      y: (n.by + Math.cos(t * n.sp * 0.8 + n.ph) * 0.05) * h,
      r: n.r * 2,
      pulse: (Math.sin(t * 1.6 + i) + 1) / 2,
    }));

    // Proximity connections.
    const maxD = Math.min(w, h) * 0.24;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d = Math.hypot(dx, dy);
        if (d < maxD) {
          const alpha = (1 - d / maxD) * 0.28;
          g2d.strokeStyle = `rgba(188,21,96,${alpha})`;
          g2d.lineWidth = 1.2;
          g2d.beginPath();
          g2d.moveTo(pts[i].x, pts[i].y);
          g2d.lineTo(pts[j].x, pts[j].y);
          g2d.stroke();
        }
      }
    }

    // Nodes with a pulsing halo.
    for (const p of pts) {
      const halo = g2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      halo.addColorStop(0, `rgba(248,26,134,${0.5 * (0.4 + p.pulse * 0.6)})`);
      halo.addColorStop(1, 'rgba(248,26,134,0)');
      g2d.fillStyle = halo;
      g2d.beginPath();
      g2d.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      g2d.fill();
      g2d.fillStyle = '#15140f';
      g2d.beginPath();
      g2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g2d.fill();
    }

    // Sweeping scanline with a soft trail.
    const scanY = ((t * 0.18) % 1.2 - 0.1) * h;
    const trail = g2d.createLinearGradient(0, scanY - 60, 0, scanY + 6);
    trail.addColorStop(0, 'rgba(248,26,134,0)');
    trail.addColorStop(1, 'rgba(248,26,134,0.16)');
    g2d.fillStyle = trail;
    g2d.fillRect(0, scanY - 60, w, 66);
    g2d.strokeStyle = 'rgba(248,26,134,0.5)';
    g2d.lineWidth = 2;
    g2d.beginPath();
    g2d.moveTo(0, scanY);
    g2d.lineTo(w, scanY);
    g2d.stroke();

    // Instrument frame.
    g2d.strokeStyle = 'rgba(21,20,15,0.16)';
    g2d.lineWidth = 2;
    g2d.strokeRect(8, 8, w - 16, h - 16);
    // Corner ticks.
    g2d.strokeStyle = 'rgba(248,26,134,0.6)';
    g2d.lineWidth = 3;
    const cl = 22;
    const corners: Array<[number, number, number, number]> = [
      [8, 8, cl, 0], [8, 8, 0, cl],
      [w - 8, 8, -cl, 0], [w - 8, 8, 0, cl],
      [8, h - 8, cl, 0], [8, h - 8, 0, -cl],
      [w - 8, h - 8, -cl, 0], [w - 8, h - 8, 0, -cl],
    ];
    g2d.beginPath();
    for (const [x, y, dx, dy] of corners) { g2d.moveTo(x, y); g2d.lineTo(x + dx, y + dy); }
    g2d.stroke();

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
