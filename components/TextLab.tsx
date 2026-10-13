'use client';
import { useState } from 'react';
import { Gauge, EngineGrid, Heatmap, WritingTips } from './Forensics';
import type { TextAnalysis } from '@/lib/text/engine';

const SAMPLE = `The rapid spread of large language models has made it increasingly difficult to tell whether a piece of writing was produced by a person or by a machine. Automated detectors attempt to close that gap by measuring perplexity, burstiness, and other statistical fingerprints that tend to differ between human and generated prose.

No single signal is reliable on its own, so modern systems combine many weak indicators into a single calibrated score. The result is a useful tool rather than a verdict, and it should always be read alongside context, provenance, and the plain judgement of a careful human reader.`;

export function TextLab() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<(TextAnalysis & { mode: string }) | null>(null);

  async function run(mode: 'full' | 'quick') {
    if (text.trim().length < 50) { setError('Paste at least ~50 characters.'); return; }
    setError(''); setBusy(true); setReport(null);
    try {
      const r = await fetch('/api/text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error ?? 'Analysis failed.');
      const payload = d.data;
      if (mode === 'quick') {
        setReport({ score: payload.score, verdict: payload.label, confidence: 'low', enginesFlagged: 0, enginesTotal: 0, engines: [], wordCount: 0, language: 'en', paragraphs: [], mode });
      } else setReport({ ...payload, mode });
    } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed.'); }
    setBusy(false);
  }

  const words = (text.match(/\S+/g) ?? []).length;
  return (
    <div className="lab">
      <div className="lab-input">
        <label className="field">
          <span className="sr-only">Text to analyze</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
            placeholder="Paste the suspect prose here…" />
        </label>
        <div className="lab-row">
          <span className="count">{words} words</span>
          <div className="lab-acts">
            <button className="quiet" type="button" onClick={() => setText(SAMPLE)}>Load sample</button>
            <button className="quiet" type="button" disabled={busy} onClick={() => void run('quick')}>Quick score</button>
            <button className="go" type="button" disabled={busy} onClick={() => void run('full')}>
              {busy ? 'Running engines…' : 'Run 8 engines'}
            </button>
          </div>
        </div>
        {error ? <p className="err">{error}</p> : null}
      </div>
      {report && report.mode === 'quick' ? (
        <p className="quick">Quick read: <b>{report.verdict}</b> ({report.score}/100)</p>
      ) : null}
      {report && report.mode !== 'quick' ? (
        <div className="lab-out">
          <div className="lab-verdict">
            <Gauge score={report.score} />
            <div>
              <h2 className="verdict-sm">{report.verdict}</h2>
              <p className="fine">Confidence: {report.confidence} · {report.enginesFlagged}/{report.enginesTotal} engines flagged · {report.wordCount} words</p>
            </div>
          </div>
          <EngineGrid engines={report.engines} />
          <WritingTips engines={report.engines} />
          <Heatmap paragraphs={report.paragraphs} />
        </div>
      ) : null}
    </div>
  );
}
