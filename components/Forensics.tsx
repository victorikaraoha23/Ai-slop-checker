'use client';
import type { TextEngineResult } from '@/lib/text/engine';

export function verdictColor(score: number): string {
  if (score <= 30) return '#2d8a4e';
  if (score <= 45) return '#8a7a00';
  if (score <= 55) return '#c46a00';
  if (score <= 80) return '#bc1560';
  return '#f81a86';
}

export function Gauge({ score }: { score: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const off = c - (c * score) / 100;
  const color = verdictColor(score);
  return (
    <div className="gauge">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`Score ${score} of 100`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#efeee9" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          transform="rotate(-90 70 70)" className="gauge-arc" />
      </svg>
      <div className="gauge-num"><b>{score}</b><span>/100</span></div>
    </div>
  );
}

export function EngineGrid({ engines }: { engines: TextEngineResult[] }) {
  return (
    <ol className="engines">
      {engines.map((e) => (
        <li key={e.code} className={`engine ${e.label}`}>
          <div className="engine-top"><b>{e.code}</b><span>{e.engine}</span><em>{Math.round(e.score * 100)}</em></div>
          <div className="engine-bar"><i style={{ width: `${Math.round(e.score * 100)}%` }} /></div>
          <p>{e.details}</p>
        </li>
      ))}
    </ol>
  );
}

export function Heatmap({ paragraphs }: { paragraphs: Array<{ index: number; score: number; label: string; preview: string }> }) {
  if (!paragraphs.length) return null;
  return (
    <div className="heatmap">
      <h3 className="report-h">Per-paragraph heatmap</h3>
      <ol>
        {paragraphs.map((p) => (
          <li key={p.index} className={`para ${p.label}`} title={`Paragraph ${p.index + 1}: ${p.score}/100`}>
            <b>P{p.index + 1} · {p.score}</b>
            <span>{p.preview}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
