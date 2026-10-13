'use client';
import type { TextEngineResult } from '@/lib/text/engine';
import type { Recommendation } from '@/lib/recommend';
import { engineTip } from '@/lib/recommend';

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

/** Ranked, actionable "here's how to fix it" list. */
export function ImprovementPlan({ plan }: { plan: Recommendation[] }) {
  if (!plan.length) return null;
  return (
    <div className="plan">
      <h3 className="report-h">Improvement plan · ranked by impact</h3>
      <ol className="plan-list">
        {plan.map((r, i) => (
          <li key={r.findingId}>
            <span className="plan-n">{String(i + 1).padStart(2, '0')}</span>
            <div className="plan-body">
              <div className="plan-head">
                <b>{r.title}</b>
                <em className={`effort ${r.effort}`}>{r.effort}</em>
              </div>
              <p>{r.fix}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Writing tips for the engines that fired hardest in a text run. */
export function WritingTips({ engines }: { engines: TextEngineResult[] }) {
  const flagged = engines
    .filter((e) => e.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  if (!flagged.length) return null;
  return (
    <div className="plan tips">
      <h3 className="report-h">How to make it read human</h3>
      <ul className="tip-list">
        {flagged.map((e) => (
          <li key={e.code}>
            <b>{e.code}</b>
            <span>{engineTip(e.code)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
