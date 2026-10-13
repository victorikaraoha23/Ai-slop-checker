import { NextRequest } from 'next/server';
import { analyzeText } from '@/lib/text/ensemble';
import { clientIp, jsonErr, jsonOk, rateLimit } from '@/lib/api';

export const maxDuration = 30;

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
      const mod = await import('pdf-parse');
      const PDFParse = (mod as { PDFParse?: new (o: { data: Buffer }) => { getText: () => Promise<{ text: string }> } }).PDFParse
        ?? (mod as unknown as { default?: new (o: { data: Buffer }) => { getText: () => Promise<{ text: string }> } }).default;
      if (!PDFParse) throw new Error('PDF parser unavailable.');
      const parser = new PDFParse({ data: buf });
      const parsed = await parser.getText();
      text = parsed.text;
    } else if (/\.docx$/i.test(name) || file.type.includes('word')) {
      const mammoth = await import('mammoth');
      const parsed = await mammoth.extractRawText({ buffer: buf });
      text = parsed.value;
    } else if (/\.(txt|md|markdown)$/i.test(name) || file.type.startsWith('text/')) {
      text = buf.toString('utf8');
    } else {
      return jsonErr('Supports .pdf, .docx, .txt, .md only.');
    }
    if (text.trim().length < 50) {
      return jsonErr('Could not extract enough text from that file.');
    }
    return jsonOk({ filename: name, ...analyzeText(text) });
  } catch {
    return jsonErr('Document analysis failed.', 500);
  }
}
