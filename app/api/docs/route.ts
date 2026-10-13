import { NextRequest, NextResponse } from 'next/server';
import { analyzeText } from '@/lib/text/ensemble';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) return NextResponse.json({ error: 'Attach a file.' }, { status: 400 });
    const name = (file as File).name ?? 'upload';
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Files over 8 MB are refused.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Supports .pdf, .docx, .txt, .md only.' }, { status: 400 });
    }
    if (text.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract enough text from that file.' }, { status: 400 });
    }
    return NextResponse.json({ filename: name, ...analyzeText(text) });
  } catch {
    return NextResponse.json({ error: 'Document analysis failed.' }, { status: 500 });
  }
}
