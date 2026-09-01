'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Section, VerdictChip } from '@/components/ui';
import { LedgerPlot } from '@/components/ledger/ledger-plot';
import { fetchJson } from '@/lib/fetcher';
import type { LedgerRun } from '@/lib/types';

const ease = [0.16, 1, 0.3, 1] as const;

const FIXTURES = ['aerodrome', 'moonwell', 'degen', 'seamless', 'friendtech'] as const;

/**
 * The ledger section, the centrepiece and the fifteen second demo. A promise
 * timeline per fixture with a real time axis, driven entirely by stored runs.
 * @returns the ledger section
 */
export function LedgerSection() {
  const [active, setActive] = useState<string>('degen');
  const run = useQuery<LedgerRun>({
    queryKey: ['ledger-section', active],
    queryFn: () => fetchJson<LedgerRun>(`/api/ledger/${active}`),
  });

  return (
    <Section
      id="ledger"
      band={3}
      density="dense"
      className="relative bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] py-24 backdrop-blur-[2px] md:py-32"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-10">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-[1.9rem] font-semibold tracking-[-0.02em] text-[var(--ink-primary)] md:text-[2.6rem]">
              One project, every version of the truth
            </h2>
            <p className="mt-3 max-w-[58ch] font-body text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
              Each marker is a published claim, its position is when it was published, its state is
              what Base says about it today
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FIXTURES.map((fixture) => (
              <button
                key={fixture}
                onClick={() => setActive(fixture)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-[140ms] ${
                  active === fixture
                    ? 'border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-primary)]'
                    : 'border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--rule-strong)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {fixture}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease }}
          >
            {run.data ? (
              <LedgerPlot run={run.data} />
            ) : run.isError ? (
              <p className="font-body text-sm text-[var(--text-secondary)]">Ledger unavailable, retry</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="skeleton-bar h-3 w-[88%] rounded-[2px]" />
                <div className="skeleton-bar h-3 w-[74%] rounded-[2px]" />
                <div className="skeleton-bar h-3 w-[52%] rounded-[2px]" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {run.data && (
          <div className="mt-6 flex items-center justify-between">
            <VerdictChip
              verdict={
                run.data.brokenCount > 0 ? 'broken' : run.data.status === 'partial' ? 'unverifiable' : 'held'
              }
            />
            <span className="mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
              COVERAGE {run.data.coveragePercent}% · {run.data.captureCount} CAPTURES ·{' '}
              {run.data.materialChangeCount} MATERIAL CHANGES
            </span>
          </div>
        )}
      </div>
    </Section>
  );
}
