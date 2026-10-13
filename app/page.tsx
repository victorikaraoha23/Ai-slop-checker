'use client';
import { useEffect, useRef, useState } from 'react';
import type { CheckResult } from '@/lib/types';
import { CheckerForm } from '@/components/CheckerForm';
import { ShotUploader } from '@/components/ShotUploader';
import { ResultView } from '@/components/ResultView';
import { analyzeImageFile } from '@/lib/image';
import { drawBlobField, drawScoreBadge } from '@/lib/canvas';

type UiResult = CheckResult & { fix: string };
const CAP = 'Specimen 01. The background blob every AI site ships, finally held for observation.';
export default function HomePage() {
  const [mode, setMode] = useState<'link' | 'shot'>('link');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState<{ label: string; hit: boolean }[]>([]);
  const [result, setResult] = useState<UiResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOrig, setShowOrig] = useState(false);
  const [critic, setCritic] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) return drawBlobField(canvasRef.current);
  }, []);
  useEffect(() => {
    const el = document.getElementById('scoreArt') as HTMLCanvasElement | null;
    if (result && el) drawScoreBadge(el, result.score);
  }, [result]);
  function trace(label: string, hit: boolean) {
    setLog((p) => [...p.slice(-5), { label, hit }]);
  }
  async function getCritic(ui: UiResult) {
    try {
      const r = await fetch('/api/roast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ findings: ui.findings, host: ui.host, score: ui.score }) });
      const d = await r.json();
      if (d?.opinion) setCritic(d.opinion);
    } catch { /* optional */ }
  }
  async function checkUrl(url: string) {
    if (!url) { setError('Paste a URL first.'); return; }
    setError(''); setBusy(true); setResult(null); setCritic(null); setLog([]); setShowOrig(false);
    trace('fetching markup', false);
    try {
      const r = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? 'Check failed.');
      const ui = d as UiResult;
      ui.findings.slice(0, 6).forEach((f) => trace(f.title.toLowerCase().slice(0, 34), true));
      trace(`total slop ${ui.score}/100`, ui.score >= 35);
      setResult(ui); setPreview(ui.screenshotUrl); setBusy(false);
      void getCritic(ui);
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (e) { setBusy(false); setError(e instanceof Error ? e.message : 'Check failed.'); }
  }

  async function onShot(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('PNG, JPG or WebP only.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('Over 12 MB. Compress the slop.'); return; }
    setError(''); setBusy(true); setResult(null); setLog([]);
    const obj = URL.createObjectURL(file);
    setPreview(obj); setShowOrig(true);
    trace('reading pixels locally', false);
    try {
      const rep = await analyzeImageFile(file);
      rep.findings.slice(0, 6).forEach((f) => trace(f.title.toLowerCase().slice(0, 34), true));
      trace(`total slop ${rep.score}/100`, rep.score >= 35);
      setResult({ host: file.name.replace(/\.[^.]+$/, '') || 'screenshot', findings: rep.findings, goodMarks: rep.goodMarks, score: rep.score, verdict: rep.verdict, screenshotUrl: obj, pageTitle: null, checkedAt: new Date().toISOString(), fix: rep.fix });
      setBusy(false);
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (e) { setBusy(false); setError(e instanceof Error ? e.message : 'Could not read image.'); }
  }
  async function share() {
    const t = result ? `My site scored ${result.score}/100 on slopcheck: ${result.verdict.label}.` : 'Is your site AI slop?';
    try { await navigator.clipboard.writeText(`${t} ${window.location.href}`); setError('Copied. Go confess publicly.'); }
    catch { setError('Clipboard blocked. Screenshot it instead.'); }
  }
  function reset() {
    setResult(null); setBusy(false); setPreview(null); setShowOrig(false); setLog([]); setError(''); setCritic(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return (
    <div className="wrap">
      <header className="top">
        <span className="mark">slop<b>/</b>check</span>
        <span>A field instrument for machine-made websites</span>
      </header>
      <main>
        <section className="hero">
          <div className="intro">
            <h1>Is your website <span className="hot">AI slop?</span></h1>
            <p className="lede">Paste a link or drop a screenshot. We read the markup and the pixels, then tell you exactly what the robots left behind.</p>
            <div className="seg" role="tablist" aria-label="What are you checking">
              <button role="tab" aria-selected={mode === 'link'} onClick={() => setMode('link')}>Link</button>
              <button role="tab" aria-selected={mode === 'shot'} onClick={() => setMode('shot')}>Screenshot</button>
            </div>
            {mode === 'link' ? <CheckerForm onCheck={(u) => void checkUrl(u)} busy={busy} /> : <ShotUploader onFile={(f) => void onShot(f)} />}
            <p className="err" role="alert">{error}</p>
          </div>
          <figure className="scope">
            <div className="screen">
              <canvas ref={canvasRef} style={{ opacity: showOrig && preview ? 0 : 1 }} />
              {preview ? <img src={preview} alt="" style={{ opacity: showOrig ? 1 : 0 }} /> : null}
            </div>
            <figcaption className="cap">
              <p>{CAP}</p>
              {preview ? <button className="peek" type="button" onClick={() => setShowOrig((v) => !v)}>{showOrig ? 'Show instrument' : 'Show original'}</button> : null}
            </figcaption>
            <ol className="log">{log.map((l, i) => <li key={i} className={l.hit ? 'hit' : ''}><span>{l.label}</span><b>{l.hit ? 'HIT' : '…'}</b></li>)}</ol>
          </figure>
        </section>
        {result ? <ResultView result={result} critic={critic} busy={false} onShare={() => void share()} onReset={reset} /> : null}
      </main>
      <footer>
        <span>slop/check. Built to bully rounded rectangles.</span>
        <span>Nothing is stored. We forget you instantly, unlike your hero section.</span>
      </footer>
    </div>
  );
}
