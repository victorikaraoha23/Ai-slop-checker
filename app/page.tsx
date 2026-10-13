'use client';
import { useEffect, useRef, useState } from 'react';
import { TextLab } from '@/components/TextLab';
import { DocLab } from '@/components/DocLab';
import { SiteLab, SiteReport } from '@/components/SiteLab';
import { ShotUploader } from '@/components/ShotUploader';
import { ResultView } from '@/components/ResultView';
import { ImprovementPlan } from '@/components/Forensics';
import { analyzeImageFile } from '@/lib/image';
import { drawBlobField, drawScoreBadge } from '@/lib/canvas';
import { recommendations } from '@/lib/recommend';
import type { CheckResult } from '@/lib/types';
import type { Recommendation } from '@/lib/recommend';

type Tab = 'site' | 'text' | 'doc' | 'shot';
type UiResult = CheckResult & { fix: string; plan: Recommendation[] };
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'site', label: 'Site URL' },
  { id: 'text', label: 'AI Text' },
  { id: 'doc', label: 'Document' },
  { id: 'shot', label: 'Screenshot' },
];
const CAP = 'Specimen 01. Every input gets dissected: markup, prose, pixels.';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('site');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState<{ label: string; hit: boolean }[]>([]);
  const [result, setResult] = useState<UiResult | null>(null);
  const [siteReport, setSiteReport] = useState<Parameters<typeof SiteReport>[0]['report'] | null>(null);
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
  function clear() {
    setResult(null); setSiteReport(null); setCritic(null);
    setLog([]); setError(''); setShowOrig(false);
  }
  async function getCritic(ui: UiResult) {
    try {
      const r = await fetch('/api/roast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ findings: ui.findings, host: ui.host, score: ui.score }) });
      const d = await r.json();
      if (d?.ok && d.data?.opinion) setCritic(d.data.opinion);
    } catch { /* optional */ }
  }
  async function checkSite(url: string) {
    if (!url) { setError('Paste a URL first.'); return; }
    clear(); setBusy(true);
    trace('fetching page', false);
    try {
      const r = await fetch('/api/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error ?? 'Scan failed.');
      const rep = d.data;
      rep.site.builders.forEach((b: { builder: string }) => trace(b.builder.toLowerCase(), true));
      rep.design.findings.slice(0, 4).forEach((f: { title: string }) => trace(f.title.toLowerCase().slice(0, 32), true));
      trace(`design slop ${rep.design.score}/100`, rep.design.score >= 35);
      setSiteReport(rep);
      setPreview(`https://image.thum.io/get/width/1200/crop/900/noanimate/${encodeURIComponent(url)}`);
      setBusy(false);
      setTimeout(() => document.getElementById('sitereport')?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (e) { setBusy(false); setError(e instanceof Error ? e.message : 'Scan failed.'); }
  }
  async function onShot(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('PNG, JPG or WebP only.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('Over 12 MB.'); return; }
    clear(); setBusy(true);
    const obj = URL.createObjectURL(file);
    setPreview(obj); setShowOrig(true);
    trace('reading pixels locally', false);
    try {
      const rep = await analyzeImageFile(file);
      rep.findings.slice(0, 6).forEach((f) => trace(f.title.toLowerCase().slice(0, 32), true));
      trace(`total slop ${rep.score}/100`, rep.score >= 35);
      setResult({ host: file.name.replace(/\.[^.]+$/, '') || 'screenshot', findings: rep.findings, goodMarks: rep.goodMarks, score: rep.score, verdict: rep.verdict, screenshotUrl: obj, pageTitle: null, checkedAt: new Date().toISOString(), fix: rep.fix, plan: recommendations(rep.findings) });
      setBusy(false);
    } catch (e) { setBusy(false); setError(e instanceof Error ? e.message : 'Could not read image.'); }
  }

  async function share() {
    const t = result ? `Score ${result.score}/100 on slopcheck.` : siteReport ? `Site scan: ${siteReport.site.verdict}` : 'Is it AI slop?';
    try { await navigator.clipboard.writeText(`${t} ${window.location.href}`); setError('Copied. Go confess publicly.'); }
    catch { setError('Clipboard blocked. Screenshot it instead.'); }
  }
  return (
    <div className="wrap">
      <header className="top">
        <span className="mark">slop<span className="slash">/</span>check <span className="live"><i />LIVE</span></span>
        <span className="tag">A forensic lab for machine-made content</span>
      </header>
      <div className="ticker" aria-hidden="true">
        <span>DELVE DETECTED · SEAMLESS FLAGGED · GRADIENT FOG AT 80% · BADGE + CENTERED HERO COMBO · EM-DASH CHAINS · LOVABLE FINGERPRINT CONFIRMED · READING PIXELS · CONSULTING SECOND OPINION ·&nbsp;</span>
      </div>
      <main>
        <section className="hero">
          <div className="intro">
            <span className="kicker">Field instrument · No. 04</span>
            <h1>Is it <span className="hot">AI slop?</span></h1>
            <p className="lede">Four instruments, one verdict. Scan a site for builder fingerprints, run 8 text engines over suspect prose, dissect a document, or read the pixels.</p>
            <div className="seg" role="tablist" aria-label="What are you checking">
              {TABS.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id}
                  onClick={() => { setTab(t.id); clear(); setPreview(null); }}>{t.label}</button>
              ))}
            </div>
            {tab === 'site' ? <SiteLab onCheck={(u) => void checkSite(u)} busy={busy} /> : null}
            {tab === 'text' ? <TextLab /> : null}
            {tab === 'doc' ? <DocLab /> : null}
            {tab === 'shot' ? <ShotUploader onFile={(f) => void onShot(f)} /> : null}
            <p className="err" role="alert">{error}</p>
          </div>
          <figure className="scope">
            <div className="specimen">
              <div className="specimen-bar">
                <span>SPECIMEN · {busy ? 'SCANNING' : preview ? 'CAPTURED' : 'IDLE'}</span>
                <span className="dots"><i /><i /><i /></span>
              </div>
              <div className="screen">
                <canvas ref={canvasRef} style={{ opacity: showOrig && preview ? 0 : 1 }} />
                {preview ? <img src={preview} alt="" style={{ opacity: showOrig ? 1 : 0 }} /> : null}
              </div>
              <figcaption className="cap">
                <p>{CAP}</p>
                {preview ? <button className="peek" type="button" onClick={() => setShowOrig((v) => !v)}>{showOrig ? 'Show instrument' : 'Show original'}</button> : null}
              </figcaption>
            </div>
            <ol className="log">
              {log.length === 0 ? <li><span className="log-empty">awaiting specimen…</span><b>···</b></li> : null}
              {log.map((l, i) => <li key={i} className={l.hit ? 'hit' : ''}><span>{l.label}</span><b>{l.hit ? 'HIT' : '···'}</b></li>)}
            </ol>
          </figure>
        </section>
        <section className="stats" aria-label="Lab capabilities">
          <div className="stat"><b>8<em>+20</em></b><span>detection engines</span></div>
          <div className="stat"><b>7</b><span>builder fingerprints</span></div>
          <div className="stat"><b>0<em>MB</em></b><span>models to download</span></div>
          <div className="stat"><b>0</b><span>bytes stored</span></div>
        </section>
        {siteReport ? (
          <section className="result" id="sitereport">
            <div className="verdict-col">
              <SiteReport report={siteReport} />
              <div className="acts">
                <button className="go" type="button" onClick={() => void share()}>Share your shame</button>
                <button className="quiet" type="button" onClick={() => { clear(); setPreview(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Try another</button>
              </div>
            </div>
            <div className="receipt-col">
              <div className="receipt">
                <div className="rc-head"><span>Slop receipt</span><span>{siteReport.host}</span></div>
                <ol className="items">
                  {siteReport.site.builders.map((b) => <li key={b.builder}><span>{b.builder} ({b.confidence})</span><span>+9</span></li>)}
                  {siteReport.design.findings.map((f) => <li key={f.id}><span>{f.title}</span><span>+{f.points}</span></li>)}
                </ol>
                <div className="total"><span>Total slop</span><span>{siteReport.design.score}/100</span></div>
              </div>
              <p className="fine">Builder fingerprints use markers verified on live deployments. Style signals alone are never used as builder evidence. Text methods ported from SlopTotal research (MIT).</p>
            </div>
            <div className="report">
              <h3 className="report-h">The evidence</h3>
              <ol className="ev">{siteReport.design.findings.map((f) => (
                <li key={f.id}><h4>{f.title}</h4><p>{f.note}</p></li>
              ))}</ol>
              {siteReport.plan?.length ? <ImprovementPlan plan={siteReport.plan} /> : null}
            </div>
          </section>
        ) : null}
        {result ? <ResultView result={result} critic={critic} busy={false} onShare={() => void share()} onReset={() => { clear(); setPreview(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /> : null}
      </main>
      <footer>
        <span>slop/check. Built to bully rounded rectangles.</span>
        <span>Nothing is stored. We forget you instantly, unlike your hero section.</span>
      </footer>
    </div>
  );
}
