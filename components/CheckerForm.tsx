'use client';
import { useState } from 'react';

export function CheckerForm({ onCheck, busy }: { onCheck: (url: string) => void; busy: boolean }) {
  const [url, setUrl] = useState('');
  return (
    <form className="panel" onSubmit={(e) => { e.preventDefault(); onCheck(url.trim()); }}>
      <div className="row">
        <label className="field">
          <span className="sr-only">Website link</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="yourwebsite.com" spellCheck={false} />
        </label>
        <button className="go" type="submit" disabled={busy}>{busy ? 'Reading slop…' : 'Check my slop'}</button>
      </div>
    </form>
  );
}
