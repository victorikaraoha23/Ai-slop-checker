import { NextRequest } from 'next/server';
import { analyzeText } from '@/lib/text/ensemble';
import { clientIp, jsonErr, jsonOk, rateLimit } from '@/lib/api';

export const maxDuration = 30;

/**
 * Extract text from a PDF using the pure-JS legacy build of pdf.js.
 * This is the Mozilla-recommended serverless path: no Web Worker and no
 * canvas, so it runs reliably in Node / Vercel functions (unlike the
 * default `pdf-parse` entry, which can resolve the browser build and
 * throw at runtime). Standard 14 fonts are used so no font files are
 * fetched.
 */
async function extractPdf(buf: Buffer): Promise<string> {
  const legacy = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const getDocument = (legacy as unknown as {
    getDocument: (o: { data: Uint8Array; useSystemFonts?: boolean; isEvalSupported?: boolean }) => {
      promise: Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }>;
      }>;
    };
  }).getDocument;
  const doc = await getDocument({ data: new Uint8Array(buf), useSystemFonts: true, isEvalSupported: false }).promise;
  const parts: string[] = [];
  const maxPages = Math.min(doc.numPages, 100);
  for (let p = 1; p <= maxPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    parts.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  return parts.join('\n');
}

/** Extract raw text from a .docx via mammoth. */
async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const parsed = await mammoth.extractRawText({ buffer: buf });
  return parsed.value;
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`docs:${clientIp(req)}`, 15)) {
      return jsonErr('Too many uploads. Try again in a minute.', 429);
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) return jsonErr('Attach a file.');
    const name = (file as File).name ?? 'upload';
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) {
      return jsonErr('Files over 8 MB are refused.');
    }
    let text = '';
    if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
      text = await extractPdf(buf);
    } else if (/\.docx$/i.test(name) || file.type.includes('word')) {
      text = await extractDocx(buf);
    } else if (/\.(txt|md|markdown)$/i.test(name) || file.type.startsWith('text/')) {
      text = buf.toString('utf8');
    } else {
      return jsonErr('Supports .pdf, .docx, .txt, .md only.');
    }
    if (text.replace(/\s+/g, ' ').trim().length < 50) {
      return jsonErr('Could not extract enough readable text from that file. Scanned or image-only PDFs have no text layer to read.');
    }
    return jsonOk({ filename: name, ...analyzeText(text) });
  } catch (err: unknown) {
    // Surface the real cause so failures are diagnosable (still user-safe:
    // library error messages, never a stack trace).
    const detail = err instanceof Error ? err.message : '';
    console.error('[docs] extraction failed:', detail);
    return jsonErr(detail ? `Document analysis failed: ${detail}` : 'Document analysis failed.', 500);
  }
}
