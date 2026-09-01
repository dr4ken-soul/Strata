'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Masthead } from '@/components/masthead';
import { StrataBackdrop } from '@/components/public-shell';
import { WalletGate } from '@/components/wallet-pill';
import { LedgerPlot } from '@/components/ledger/ledger-plot';
import { AttestControl } from '@/components/app/attest-control';
import { fetchJson } from '@/lib/fetcher';
import type { LedgerRun } from '@/lib/types';

/**
 * The single ledger view for the app interior, reusing the plot at full width
 * with a header strip and the attest control. Attaching the attest control is
 * the difference from the public page.
 * @param props.params - the route params carrying the slug
 * @returns the app ledger page
 */
export default function AppLedgerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <WalletGate>
      <StrataBackdrop />
      <Masthead />
      <main className="relative z-10 mx-auto min-h-[100dvh] max-w-6xl px-5 pb-24 pt-28 md:px-10">
        <AppLedger slug={slug} />
      </main>
    </WalletGate>
  );
}

/**
 * Loads the stored run and renders the header strip, plot and attest control.
 * @param props.slug - the ledger slug
 * @returns the loaded ledger view or its loading and failure states
 */
function AppLedger({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useQuery<LedgerRun>({
    queryKey: ['app-ledger', slug],
    queryFn: () => fetchJson<LedgerRun>(`/api/ledger/${slug}`),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="skeleton-bar h-3 w-2/3 rounded-[2px]" />
        <div className="skeleton-bar h-3 w-full rounded-[2px]" />
        <div className="skeleton-bar h-3 w-1/2 rounded-[2px]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-24 font-body text-sm text-[var(--text-secondary)]">
        Ledger unavailable for {slug}, retry from the index
      </p>
    );
  }

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold text-[var(--ink-primary)] md:text-2xl">
            {data.name}
          </h1>
          <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {data.host} · COVERAGE {data.coveragePercent}% · LAST VERIFICATION BLOCK{' '}
            {data.lastBlock}
          </p>
          {data.status === 'partial' && (
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--unverifiable)]">
              PARTIAL COVERAGE · {data.coveragePercent}% OF THE WINDOW HAS CAPTURES
            </p>
          )}
        </div>
        <AttestControl run={data} />
      </div>
      <LedgerPlot run={data} />
    </div>
  );
}
