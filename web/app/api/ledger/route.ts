import { NextResponse } from 'next/server';
import { fetchJson } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ledger, queues a run against the engine, one queued run per wallet
 * per five minutes is enforced engine side.
 * @param request - the incoming request carrying target and wallet address
 * @returns the queued run slug
 */
export async function POST(request: Request) {
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL;
  if (!engineUrl) {
    return NextResponse.json({ error: 'engine url not configured' }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }
  try {
    const result = await fetch(`${engineUrl}/ledger`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const payload: unknown = await result.json();
    return NextResponse.json(payload, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'engine unreachable' }, { status: 502 });
  }
}
