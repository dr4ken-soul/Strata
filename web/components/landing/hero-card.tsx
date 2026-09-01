'use client';

import { motion } from 'motion/react';
import { formatDate } from '@/lib/format';
import type { LedgerRun } from '@/lib/types';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The floating ledger card, every value read from the stored Degen run through
 * the ledger API at render time, with specified loading and failure states and
 * no placeholder numbers anywhere.
 * @param props.ledger - the fetched run, or undefined while loading or on error
 * @param props.isLoading - whether the query is loading
 * @param props.isError - whether the query failed
 * @returns the ledger card element
 */
export function HeroLedgerCard({
  ledger,
  isLoading,
  isError,
}: {
  ledger: LedgerRun | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, ease, delay: 0.5 }}
      className="z-20 mb-8 w-full lg:absolute lg:right-10 lg:top-32 lg:mb-0 lg:w-[380px] xl:right-16 xl:top-36 xl:w-[420px]"
    >
      <div className="rounded-[10px] bg-[var(--bg-secondary)] p-2 ring-1 ring-[var(--rule)]">
        <div
          className="rounded-[6px] bg-[var(--bg-elevated)] p-5 md:p-6"
          style={{ boxShadow: '0 20px 40px -15px rgba(16, 20, 24, 0.06)' }}
        >
          <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-3">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Degen · Tokenomics · Diff {ledger ? ledger.claims.length : '\u2014'}
            </span>
            <span className="mono text-[10px] tracking-[0.12em] text-[var(--text-muted)]">
              {ledger ? formatDate(ledger.windowEnd) : ''}
            </span>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            {ledger ? (
              <HeroDiff run={ledger} />
            ) : isError ? (
              <p className="font-body text-sm text-[var(--text-secondary)]">Ledger unavailable, retry</p>
            ) : isLoading ? (
              <>
                <div className="skeleton-bar h-3 w-[88%] rounded-[2px]" />
                <div className="skeleton-bar h-3 w-[74%] rounded-[2px]" />
                <div className="skeleton-bar h-3 w-[52%] rounded-[2px]" />
              </>
            ) : null}
          </div>
          {ledger && (
            <div className="mt-4 border-t border-[var(--rule)] pt-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-3.5 w-3.5 text-[var(--accent)]"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="5.25" />
                  <path d="M3.2 10.8L10.8 3.2" />
                </svg>
                <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                  Changed without announcement
                </span>
              </div>
              <p className="mono mt-2 w-full text-[10px] tracking-[0.1em] text-[var(--text-secondary)]">
                CHECKED AGAINST BASE AT BLOCK {ledger.lastBlock}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Renders the first broken claim of the stored Degen run as the hero diff body.
 * Every value is read from the stored run, none is hardcoded or invented.
 * @param props.run - the stored Degen ledger run
 * @returns the removed and added lines of the latest revision
 */
export function HeroDiff({ run }: { run: LedgerRun }) {
  const broken = run.verifications.filter((verification) => verification.verdict === 'broken');
  const target = broken.length > 0 ? broken[0] : undefined;
  const claim = target ? run.claims.find((entry) => entry.claimId === target.claimId) : undefined;
  if (!claim || !target) {
    return (
      <p className="font-body text-sm text-[var(--text-secondary)]">No revision in the stored window</p>
    );
  }
  const superseded = claim.supersedes
    ? run.claims.find((entry) => entry.claimId === claim.supersedes)
    : undefined;
  return (
    <>
      {superseded && (
        <div className="flex items-start gap-2">
          <span className="mono text-[11px] leading-5 text-[var(--accent)]">−</span>
          <span className="mono text-[11px] leading-5 text-[var(--text-muted)] line-through decoration-[var(--accent)]/60 md:text-xs">
            {superseded.valueAsWritten}
            {superseded.unit ? ` ${superseded.unit}` : ''}
          </span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="mono text-[11px] leading-5 text-[var(--ink-primary)]">+</span>
        <span className="mono text-[11px] leading-5 text-[var(--ink-primary)] md:text-xs">
          {claim.valueAsWritten}
          {claim.unit ? ` ${claim.unit}` : ''}
        </span>
      </div>
    </>
  );
}
