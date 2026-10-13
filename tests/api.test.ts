import { NextRequest } from 'next/server';
import { POST as checkRoute } from '../app/api/check/route';
import { POST as site } from '../app/api/site/route';
import { POST as text } from '../app/api/text/route';
import { POST as docs } from '../app/api/docs/route';
import { POST as roast } from '../app/api/roast/route';

const AI_TEXT = `Delve into the future of seamless productivity. Our cutting-edge, all-in-one platform empowers teams to unlock next-level results. Furthermore, it is important to note that leveraging robust innovation has never been easier. In conclusion, this game-changer will supercharge your workflow like never before. Additionally, the seamless interface elevates every interaction. Moreover, our revolutionary approach streamlines success. Lastly, unlock your potential today.`;

function jsonReq(obj: unknown): NextRequest {
  return new NextRequest('http://localhost/api/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(obj),
  });
}

let pass = 0;
let fail = 0;
async function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name} ${extra}`); }
}

async function shapeIsStandard(res: Response): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  const body = (await res.json()) as Record<string, unknown>;
  const hasOk = typeof body.ok === 'boolean';
  if (hasOk && body.ok === true) return { ok: hasOk && 'data' in body, body };
  return { ok: hasOk && typeof body.error === 'string', body };
}

async function main() {
  // ---- /api/text ----
  console.log('api/text');
  {
    const res = await text(jsonReq({ text: AI_TEXT, mode: 'full' }));
    const { ok, body } = await shapeIsStandard(res);
    check('full mode standard shape', ok && res.status === 200);
    const data = body.data as { score: number; engines: unknown[]; mode: string };
    check('full mode returns score + 8 engines', typeof data.score === 'number' && data.engines.length === 8 && data.mode === 'full');
  }
  {
    const res = await text(jsonReq({ text: AI_TEXT, mode: 'quick' }));
    const { ok } = await shapeIsStandard(res);
    check('quick mode standard shape', ok && res.status === 200);
  }
  {
    const res = await text(jsonReq({ snippets: [{ id: 'a', text: AI_TEXT }, { id: 'b', text: 'hi there' }] }));
    const { ok, body } = await shapeIsStandard(res);
    const data = body.data as { results: Array<{ id: string; score: number }> };
    check('batch snippets shape', ok && Array.isArray(data.results) && data.results.length === 2);
  }
  {
    const res = await text(jsonReq({ text: 'too short' }));
    check('short text -> 400 + error string', res.status === 400, `got ${res.status}`);
    const { ok } = await shapeIsStandard(res);
    check('short text error envelope', ok);
  }
  {
    const res = await text(jsonReq({}));
    check('missing text -> 400', res.status === 400, `got ${res.status}`);
  }

  // ---- /api/site ----
  console.log('api/site');
  {
    const res = await site(jsonReq({ url: 'localhost:8080/admin' }));
    check('private host blocked -> 400', res.status === 400, `got ${res.status}`);
    const { ok } = await shapeIsStandard(res);
    check('block error envelope', ok);
  }
  {
    const res = await site(jsonReq({ url: '' }));
    check('empty url -> 400', res.status === 400, `got ${res.status}`);
  }
  {
    const res = await site(jsonReq({ url: 'ftp://example.com' }));
    check('non-http scheme rejected', res.status === 400, `got ${res.status}`);
  }

  // ---- /api/check ----
  console.log('api/check');
  {
    const res = await checkRoute(jsonReq({ url: 'http://127.0.0.1/secret' }));
    check('loopback blocked -> 400', res.status === 400, `got ${res.status}`);
  }
  {
    const res = await checkRoute(jsonReq({}));
    check('missing url -> 400', res.status === 400, `got ${res.status}`);
  }

  // ---- /api/docs ----
  console.log('api/docs');
  {
    const fd = new FormData();
    fd.append('file', new Blob([AI_TEXT + '\n\n' + AI_TEXT], { type: 'text/plain' }), 'essay.txt');
    const res = await docs(new NextRequest('http://localhost/api/docs', { method: 'POST', body: fd }));
    const { ok, body } = await shapeIsStandard(res);
    check('txt upload standard shape', ok && res.status === 200);
    const data = body.data as { filename: string; engines: unknown[] };
    check('txt upload returns filename + engines', data.filename === 'essay.txt' && data.engines.length === 8);
  }
  {
    const fd = new FormData();
    fd.append('file', new Blob(['tiny'], { type: 'text/plain' }), 'a.txt');
    const res = await docs(new NextRequest('http://localhost/api/docs', { method: 'POST', body: fd }));
    check('too-little text -> 400', res.status === 400, `got ${res.status}`);
  }
  {
    const res = await docs(new NextRequest('http://localhost/api/docs', { method: 'POST', body: new FormData() }));
    check('no file -> 400', res.status === 400, `got ${res.status}`);
  }

  // ---- /api/roast ----
  console.log('api/roast');
  {
    const res = await roast(jsonReq({ host: 'example.com', score: 72, findings: [{ title: 'gradient fog', roast: 'neon everywhere' }] }));
    const { ok, body } = await shapeIsStandard(res);
    // Without an API key it returns { ok, data: { opinion: null, disabled: true } }.
    check('roast standard shape', ok && res.status === 200);
    const data = body.data as { opinion: string | null; disabled: boolean };
    check('roast data has opinion+disabled', 'opinion' in data && 'disabled' in data);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

void main();
