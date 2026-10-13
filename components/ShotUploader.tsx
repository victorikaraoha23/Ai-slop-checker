'use client';
import { useRef } from 'react';

export function ShotUploader({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="panel">
      <button className="drop" type="button" onClick={() => ref.current?.click()}>
        <strong>Drop, paste or choose a screenshot</strong>
        <span>PNG, JPG or WebP up to 12 MB. It never leaves your browser.</span>
      </button>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}
