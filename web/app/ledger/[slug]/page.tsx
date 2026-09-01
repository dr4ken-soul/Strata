import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';
import { fetchJson } from '@/lib/fetcher';
import type { LedgerRun } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * The public read only ledger page, server rendered so it is linkable and
 * indexable, with no wallet anywhere on it, and it renders down to static
 * content with JavaScript disabled.
 * @param props.params - the route params carrying the slug
 * @returns the server rendered ledger page, or the not found state
 */
export default async function PublicLedgerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let run: LedgerRun | null = null;
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL;
  if (engineUrl) {
    try {
      run = await fetchJson<LedgerRun>(`${engineUrl}/ledger/${encodeURIComponent(slug)}`);
    } catch {
      run = null;
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-10">
        {run ? (
          <ServerLedger run={run} />
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-[1.9rem] font-semibold text-[var(--ink-primary)] md:text-[2.6rem]">
              Ledger not available
            </p>
            <p className="mono mt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              NO STORED RUN FOR {slug}
            </p>
            <Link
              href="/"
              className="mono mt-6 inline-block text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
            >
              Back to Strata
            </Link>
          </div>
        )}
      </div>
    </PublicShell>
  );
}

/**
 * Renders the stored ledger statically for the server rendered page.
 * @param props.run - the stored run
 * @returns the ledger header, coverage statement and claim table
 */
function ServerLedger({ run }: { run: LedgerRun }) {
  return (
    <div>
      <h1 className="font-display text-[1.9rem] font-semibold tracking-[-0.02em] text-[var(--ink-primary)] md:text-[2.6rem]">
        {run.name}
      </h1>
      <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {run.host} · {run.captureCount} CAPTURES · COVERAGE {run.coveragePercent}% ·{' '}
        {run.materialChangeCount} MATERIAL CHANGES · {run.brokenCount} BROKEN
      </p>
      {run.status === 'partial' && (
        <p className="mono mt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--unverifiable)]">
          PARTIAL COVERAGE · {run.coveragePercent}% OF THE WINDOW HAS CAPTURES
        </p>
      )}
      <div className="mt-10 border-t border-[var(--rule)]">
        {run.claims.map((claim) => {
          const verification = run.verifications.find((entry) => entry.claimId === claim.claimId);
          return (
            <div
              key={claim.claimId}
              className="grid grid-cols-1 gap-3 border-b border-[var(--rule)] py-5 md:grid-cols-[8rem_1fr_1fr]"
            >
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {claim.category}
              </span>
              <div>
                <p className="mono text-[11px] text-[var(--ink-primary)]">
                  {claim.valueAsWritten}
                  {claim.unit ? ` ${claim.unit}` : ''}
                </p>
                <blockquote className="mt-1 border-l-2 border-[var(--rule-strong)] pl-3 font-body text-sm text-[var(--text-secondary)]">
                  {claim.quote}
                </blockquote>
              </div>
              <div>
                {verification ? (
                  <>
                    <p className="mono text-[10px] tracking-[0.1em] text-[var(--text-secondary)]">
                      {verification.method} @ {verification.contract ?? 'offchain'} · BLOCK{' '}
                      {verification.blockNumber}
                    </p>
                    <p
                      className="mono mt-1 text-[10px] uppercase tracking-[0.16em]"
                      style={{
                        color:
                          verification.verdict === 'held'
                            ? 'var(--verified)'
                            : verification.verdict === 'broken'
                              ? 'var(--accent)'
                              : 'var(--unverifiable)',
                      }}
                    >
                      {verification.verdict.toUpperCase()}
                      {verification.reason ? ` · ${verification.reason}` : ''}
                    </p>
                  </>
                ) : (
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--unverifiable)]">
                    NO ONCHAIN EQUIVALENT · PROMISE WITH NO PROOF
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
