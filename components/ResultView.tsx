'use client';
import type { CheckResult } from '@/lib/types';
import type { Recommendation } from '@/lib/recommend';
import { ImprovementPlan } from './Forensics';

export function ResultView({ result, critic, busy, onShare, onReset }: {
  result: CheckResult & { fix: string; plan: Recommendation[] };
  critic: string | null;
  busy: boolean;
  onShare: () => void;
  onReset: () => void;
}) {
  return (
    <section className="result" id="result">
      <div className="verdict-col">
        <span className="stamp" style={{ color: result.score >= 55 ? 'var(--pink)' : result.score >= 35 ? 'var(--warn)' : 'var(--clean)' }}>
          {result.score >= 80 ? 'Certified slop' : result.score >= 55 ? 'Sloppy' : result.score >= 35 ? 'Suspect' : result.score >= 15 ? 'Mostly human' : 'Hand-made'}
        </span>
        <canvas className="score" id="scoreArt" />
        <h2 className="verdict">{result.verdict.label} — {result.score}/100</h2>
        <p className="critic">{busy ? 'Consulting the second opinion…' : (critic ?? result.verdict.summary)}</p>
        {result.aiAnalysis ? (
          <div className="ai-analysis" aria-label="AI analysis">
            <b>AI analysis</b>
            {result.aiAnalysis.split(/\\n\\s*\\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        ) : null}
        <ul className="roasts">{result.findings.slice(0, 5).map((f) => (
          <li key={f.id}><b>+{f.points} · {f.category}</b>{f.roast}</li>
        ))}</ul>
        <p className="fix"><span>If you fix one thing</span><b>{result.fix}</b></p>
        {result.plan?.length ? <ImprovementPlan plan={result.plan} /> : null}
        <div className="acts">
          <button className="go" type="button" onClick={onShare}>Share your shame</button>
          <button className="quiet" type="button" onClick={onReset}>Try another</button>
        </div>
      </div>
      <div className="receipt-col">
        <div className="receipt">
          <div className="rc-head"><span>Slop receipt</span><span>{result.host}</span></div>
          <ol className="items">{result.findings.map((f) => (
            <li key={f.id}><span>{f.title}</span><span>+{f.points}</span></li>
          ))}</ol>
          <div className="total"><span>Total slop</span><span>{result.score}/100</span></div>
        </div>
        <p className="fine">Not science. Links are read through a text proxy. The second opinion is written by an AI from the findings above; screenshots stay on your device.</p>
      </div>
      <div className="report">
        <h3 className="report-h">The evidence</h3>
        <p className="report-lede">{result.pageTitle ?? `What the instrument found on ${result.host}.`}</p>
        <ol className="ev">{result.findings.map((f) => (
          <li key={f.id}>
            <h4>{f.title}</h4>
            <p>{f.note}</p>
            {f.evidence.slice(0, 2).map((e, i) => <code key={i}>{e.label}</code>)}
          </li>
        ))}</ol>
        {result.goodMarks.length ? (
          <div><h3 className="report-h">What you got right</h3>
            <ul className="ev">{result.goodMarks.map((g, i) => (
              <li key={i}><h4>{g.title}</h4><p>{g.note}</p></li>
            ))}</ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
