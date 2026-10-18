'use client';
import { useState } from 'react';
import { Gauge, EngineGrid, Heatmap, WritingTips } from './Forensics';

interface DocReport {
  filename: string;
  score: number;
  verdict: string;
  confidence: string;
  enginesFlagged: number;
  enginesTotal: number;
  engines: Parameters<typeof EngineGrid>[0]['engines'];
  paragraphs: Parameters<typeof Heatmap>[0]['paragraphs'];
  wordCount: number;
}

export function DocLab({ onShare }: { onShare?: (score: number, verdict: string, host: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<DocReport | null>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(''); setBusy(true); setReport(null);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const r = await fetch('/api/docs', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error ?? 'Document check failed.');
      setReport(d.data as DocReport);
    } catch (e) { setError(e instanceof Error ? e.message : 'Document check failed.'); }
    setBusy(false);
  }

  return (
    <div className="lab">
      <label className="drop">
        <strong>{busy ? 'Extracting text…' : 'Drop a document'}</strong>
        <span>PDF, DOCX, TXT or Markdown up to 8 MB. Text is extracted server-side, never stored.</span>
        <input type="file" accept=".pdf,.docx,.txt,.md,.markdown" hidden
          onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>
      {error ? <p className="err">{error}</p> : null}
      {report ? (
        <div className="lab-out">
          <div className="lab-verdict">
            <Gauge score={report.score} />
            <div>
              <h2 className="verdict-sm">{report.verdict}</h2>
              <p className="fine">{report.filename} · {report.wordCount} words · {report.enginesFlagged}/{report.enginesTotal} engines flagged</p>
            </div>
          </div>
          <EngineGrid engines={report.engines} />
          <WritingTips engines={report.engines} />
          <Heatmap paragraphs={report.paragraphs} />
          {onShare ? <div className="acts"><button className="go" type="button" onClick={() => onShare(report.score, report.verdict, report.filename)}>Share your shame</button></div> : null}
        </div>
      ) : null}
    </div>
  );
}
