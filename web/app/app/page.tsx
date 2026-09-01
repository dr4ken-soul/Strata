'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PrimaryCta, VerdictChip } from '@/components/ui';
import { WalletGate } from '@/components/wallet-pill';
import { Masthead } from '@/components/masthead';
import { StrataBackdrop } from '@/components/public-shell';
import { fetchJson } from '@/lib/fetcher';
import type { FixtureSummary } from '@/lib/types';

/**
 * The wallet gated ledger index. Renders only while a wallet is connected,
 * shows the branded skeleton while reconnecting, and the branded landing page
 * otherwise. Populated state is a table, not cards.
 * @returns the app index page
 */
export default function AppIndexPage() {
  return (
    <WalletGate>
      <StrataBackdrop />
      <Masthead />
      <main className="relative z-10 mx-auto min-h-[100dvh] max-w-6xl px-5 pb-24 pt-28 md:px-10">
        <div className="mb-10 flex items-end justify-between">
          <h1 className="font-display text-[1.75rem] font-semibold text-[var(--ink-primary)] md:text-2xl">
            Your ledgers
          </h1>
          <Link
            href="/app/new"
            className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:text-[var(--accent)]"
          >
            New ledger
          </Link>
        </div>
        <LedgerTable />
      </main>
    </WalletGate>
  );
}

/**
 * The ledger table. Reads the stored runs from the engine, renders the required
 * empty state when none exist, and five skeleton rows while loading.
 * @returns the ledger table element
 */
function LedgerTable() {
  const { data, isLoading } = useQuery<FixtureSummary[]>({
    queryKey: ['app-ledgers'],
    queryFn: () => fetchJson<FixtureSummary[]>('/api/fixtures'),
  });

  if (isLoading) {
    return (
      <div className="w-full border-t border-[var(--rule)]">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="border-b border-[var(--rule)] py-4">
            <div className="skeleton-bar h-3 w-full rounded-[2px]" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mx-auto flex max-w-[46ch] flex-col items-center py-24 text-center">
        <svg
          className="h-8 w-8 text-[var(--text-muted)]"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          aria-hidden="true"
        >
          <path d="M6 4h14l6 6v18H6z" />
          <path d="M20 4v6h6" />
        </svg>
        <p className="mt-4 font-body text-sm text-[var(--text-secondary)]">
          No ledger yet, paste a token address or a docs URL and Strata will build one
        </p>
        <div className="mt-6">
          <Link href="/app/new">
            <PrimaryCta />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-t border-[var(--rule)]">
      {data.map((fixture) => (
        <Link
          key={fixture.slug}
          href={`/app/ledger/${fixture.slug}`}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-[var(--rule)] py-4 transition-colors duration-[200ms] hover:bg-[var(--bg-secondary)]/60"
        >
          <span className="font-body text-sm text-[var(--ink-primary)]">{fixture.name}</span>
          <span className="mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
            {fixture.captureCount} CAPTURES
          </span>
          <span className="mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
            {fixture.materialChangeCount} MATERIAL
          </span>
          <VerdictChip
            verdict={
              fixture.brokenCount > 0
                ? 'broken'
                : fixture.status === 'partial'
                  ? 'unverifiable'
                  : 'held'
            }
          />
        </Link>
      ))}
    </div>
  );
}
