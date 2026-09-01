'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchJson } from '@/lib/fetcher';
import { relativeTime } from '@/lib/format';
import type { FixtureSummary, IngestEvent } from '@/lib/types';

interface MastheadData {
  snapshotCount: number;
  lastIngestAt: number | null;
  events: IngestEvent[];
}

/**
 * Fixed editorial masthead strip, issue line with live snapshot counts, a real
 * record ticker hidden below md, and the single connect gated action.
 * @returns the masthead element
 */
export function Masthead() {
  const { data } = useQuery<MastheadData>({
    queryKey: ['masthead'],
    queryFn: async () => {
      const fixtures = await fetchJson<FixtureSummary[]>('/api/fixtures');
      const events = await fetchJson<IngestEvent[]>('/api/ingest-events');
      return {
        snapshotCount: fixtures.reduce((sum, fixture) => sum + fixture.captureCount, 0),
        lastIngestAt: events.length > 0 ? (events[0] as IngestEvent).at : null,
        events: events.slice(0, 5),
      };
    },
    refetchInterval: 60_000,
  });

  return (
    <header className="fixed inset-x-0 top-0 z-[200] border-b border-[var(--rule)] bg-[color-mix(in_srgb,var(--bg-primary)_88%,transparent)] backdrop-blur-md">
      <div className="flex h-11 items-center justify-between px-4 md:h-12 md:px-8">
        <div className="flex items-center">
          <span className="mono text-[11px] uppercase tracking-[0.32em] text-[var(--ink-primary)] md:text-xs">
            STRATA
          </span>
          <span className="mx-3 h-3 w-px bg-[var(--rule-strong)] md:mx-4" />
          <span className="mono hidden text-[10px] tracking-[0.12em] text-[var(--text-muted)] sm:block md:text-[11px]">
            {data ? (
              <>
                SNAPSHOTS {data.snapshotCount}
                {data.lastIngestAt !== null && <> · LAST INGEST {relativeTime(data.lastIngestAt)}</>}
              </>
            ) : (
              <span className="skeleton-bar inline-block h-2.5 w-28 rounded-[2px]" />
            )}
          </span>
        </div>

        <div className="relative mx-8 hidden flex-1 overflow-hidden md:flex">
          <div className="absolute inset-y-0 left-0 z-10 w-16" style={{ background: 'linear-gradient(to right, var(--bg-primary), transparent)' }} />
          <div className="absolute inset-y-0 right-0 z-10 w-16" style={{ background: 'linear-gradient(to left, var(--bg-primary), transparent)' }} />
          <div className="flex w-max gap-10" style={{ animation: 'masthead-ticker 48s linear infinite' }}>
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-10" aria-hidden={copy === 1}>
                {(data?.events ?? []).map((event) => (
                  <span
                    key={`${copy}-${event.slug}-${event.at}`}
                    className="mono whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                  >
                    {event.project} · {event.materialChangeCount} MATERIAL CHANGES · BLOCK {event.blockNumber}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/app"
          className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:text-[var(--accent)] md:text-[11px]"
        >
          Run a ledger
        </Link>
      </div>
    </header>
  );
}
