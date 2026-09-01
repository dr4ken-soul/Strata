import { NextResponse } from 'next/server';
import { fetchJson } from '@/lib/fetcher';
import type { FixtureSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fixtures, returns the five stored fixture runs that back the landing
 * page, read from the engine. An empty list is the correct response when the
 * engine is unreachable, no figure is ever invented.
 * @returns the fixture summaries
 */
export async function GET() {
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL;
  if (!engineUrl) {
    return NextResponse.json([] satisfies FixtureSummary[]);
  }
  try {
    const fixtures = await fetchJson<FixtureSummary[]>(`${engineUrl}/api/fixtures`);
    return NextResponse.json(fixtures);
  } catch {
    return NextResponse.json({ error: 'engine unreachable' }, { status: 502 });
  }
}
