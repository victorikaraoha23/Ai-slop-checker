'use client';
import { useState } from 'react';
import { Gauge } from './Forensics';
import type { Finding, GoodMark } from '@/lib/types';

interface BuilderHit { builder: string; confidence: string; evidence: string[]; }
interface SiteReport {
  host: string;
  site: { builders: BuilderHit[]; verdict: string };
  design: { score: number; findings: Finding[]; goodMarks: GoodMark[] };
  text: { score: number; verdict: string; confidence: string } | null;
}

export function SiteLab({ onCheck, busy }: { onCheck: (url: string) => void; busy: boolean }) {
  const [url, setUrl] = useState('');
  return (
    <form className="panel" onSubmit={(e) => { e.preventDefault(); onCheck(url.trim()); }}>
      <div className="row">
        <label className="field">
          <span className="sr-only">Website link</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="yourwebsite.com" spellCheck={false} />
        </label>
        <button className="go" type="submit" disabled={busy}>{busy ? 'Scanning…' : 'Scan site'}</button>
      </div>
    </form>
  );
}

export function SiteReport({ report }: { report: SiteReport }) {
  return (
    <div className="lab-out">
      <div className="builder-card">
        <h3 className="report-h">Builder fingerprints</h3>
        <p className="builder-verdict">{report.site.verdict}</p>
        {report.site.builders.length ? (
          <ul className="builders">
            {report.site.builders.map((b) => (
              <li key={b.builder}>
                <b>{b.builder}</b><em>{b.confidence}</em>
                <span>{b.evidence.join(' · ') || 'header marker'}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="lab-verdict">
        <Gauge score={report.design.score} />
        <div>
          <h2 className="verdict-sm">Design slop: {report.design.score}/100</h2>
          {report.text ? (
            <p className="fine">Copy read: {report.text.verdict} ({report.text.score}/100, {report.text.confidence} confidence)</p>
          ) : <p className="fine">Not enough on-page copy to score the words.</p>}
        </div>
      </div>
      {report.design.findings.length ? (
        <ol className="ev">{report.design.findings.slice(0, 8).map((f) => (
          <li key={f.id}><h4>{f.title} +{f.points}</h4><p>{f.note}</p></li>
        ))}</ol>
      ) : <p className="fine">No design fingerprints. Suspiciously tasteful.</p>}
    </div>
  );
}
