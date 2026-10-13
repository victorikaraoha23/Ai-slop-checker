import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/* ------------------------------------------------------------------ *
 * Shared API layer — one response shape for every route, plus the
 * guards (validation, size caps, rate limiting, SSRF) that keep the
 * endpoints standardized, error-proof and safe to expose publicly.
 * ------------------------------------------------------------------ */

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: string;
}

/** Success envelope. `no-store` so nothing is cached at the edge. */
export function jsonOk<T>(data: T, status = 200): NextResponse<ApiOk<T>> {
  return NextResponse.json({ ok: true, data }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/** Error envelope. Message is user-safe (never a stack trace). */
export function jsonErr(message: string, status = 400): NextResponse<ApiErr> {
  return NextResponse.json({ ok: false, error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/** Parse a JSON body without throwing; returns `{}` on any failure. */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function asString(v: unknown, max = 4096): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

/** Normalize a user URL and reject non-http(s) + private/internal hosts. */
export function normalizeUrl(input: string): string {
  let v = input.trim();
  if (!v) throw new Error('Enter a URL first.');
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  const u = new URL(v);
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new Error('Only http(s) URLs are supported.');
  }
  if (isPrivateHost(u.hostname)) {
    throw new Error('Private network addresses are blocked.');
  }
  return u.toString();
}

const PRIVATE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1$|\[::1\]$|fe80:|fd|fc)/i;

export function isPrivateHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return PRIVATE.test(h);
}

/** Best-effort client IP from proxy headers (for rate limiting). */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'local';
}

/* Fixed-window, in-memory rate limiter. Note: on serverless this is
 * per-instance and best-effort — it deters naive abuse, it is not a
 * distributed limiter. Generous limits so legitimate use never trips. */
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}
