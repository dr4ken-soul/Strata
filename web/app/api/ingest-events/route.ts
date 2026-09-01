import { NextResponse } from 'next/server';
import { fetchJson } from '@/lib/fetcher';
import type { IngestEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ingest-events, returns the most recent real ingest events for the
 * masthead ticker, read from the engine. Empty when the engine is not configured.
 * @returns the recent ingest events
 */
export async function GET() {
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL;
  if (!engineUrl) {
    return NextResponse.json([] satisfies IngestEvent[]);
  }
  try {
    const events = await fetchJson<IngestEvent[]>(`${engineUrl}/api/ingest-events`);
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: 'engine unreachable' }, { status: 502 });
  }
}
