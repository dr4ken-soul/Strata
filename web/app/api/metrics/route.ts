import { NextResponse } from 'next/server';
import { readRegistryMetrics } from '@/lib/eas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics, returns the three live counters read from the Strata
 * registry contract on Base. Nulls with a retry hint when the registry is not
 * configured, never zeros rendered as if they were real.
 * @returns the live metric counters
 */
export async function GET() {
  const registryAddress = process.env.NEXT_PUBLIC_STRATA_REGISTRY_ADDRESS;
  if (!registryAddress) {
    return NextResponse.json({ available: false, error: 'registry address not configured' });
  }
  try {
    const metrics = await readRegistryMetrics(registryAddress);
    return NextResponse.json({
      available: true,
      projectsOnRecord: metrics.projectsOnRecord.toString(),
      materialChanges: metrics.materialChanges.toString(),
      attestations: metrics.attestations.toString(),
    });
  } catch {
    return NextResponse.json({ available: false, error: 'registry read failed' }, { status: 502 });
  }
}
