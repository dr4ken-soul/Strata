import { NextResponse } from 'next/server';
import { fetchJson } from '@/lib/fetcher';
import type { LedgerRun } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ledger/[slug], returns the full stored ledger with claims,
 * verifications and coverage, read from the engine.
 * @param _request - the incoming request, unused
 * @param props.params - the route params carrying the slug
 * @returns the full ledger run, or 404 when the slug is unknown
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL;
  if (!engineUrl) {
    return NextResponse.json({ error: 'engine url not configured' }, { status: 503 });
  }
  try {
    const run = await fetchJson<LedgerRun>(`${engineUrl}/ledger/${encodeURIComponent(slug)}`);
    return NextResponse.json(run);
  } catch {
    return NextResponse.json({ error: `ledger not found for ${slug}` }, { status: 404 });
  }
}
