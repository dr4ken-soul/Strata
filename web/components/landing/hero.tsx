'use client';

import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { PrimaryCta, Section } from '@/components/ui';
import { fetchJson } from '@/lib/fetcher';
import { formatDate } from '@/lib/format';
import type { LedgerRun } from '@/lib/types';
import { HeroLedgerCard, HeroDiff } from './hero-card';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The hero, bottom left content anchor with a live ledger card offset upper
 * right carrying real fixture data from the stored Degen run.
 * @returns the hero section
 */
export function Hero() {
  const ledger = useQuery<LedgerRun>({
    queryKey: ['hero-ledger', 'degen'],
    queryFn: () => fetchJson<LedgerRun>('/api/ledger/degen'),
  });

  return (
    <Section band={0} density="hero" className="relative min-h-[100dvh] w-full overflow-hidden">
      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-16 pt-28 md:px-10 md:pb-20 lg:px-16 lg:pb-24">
        <div className="flex flex-col-reverse lg:block">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="mono mb-5 text-[10px] uppercase tracking-[0.26em] text-[var(--accent)] md:mb-6 md:text-[11px]"
            >
              Promise ledger · Base
            </motion.p>
            <h1 className="font-display font-semibold leading-[0.94] tracking-[-0.03em] text-[var(--ink-primary)] text-[2.75rem] md:text-[4.25rem] lg:max-w-[52%] lg:text-[5.75rem]">
              {'What they promised'.split(' ').map((word, i) => (
                <motion.span
                  key={`a-${word}`}
                  className="inline-block"
                  initial={{ filter: 'blur(8px)', opacity: 0, y: 18 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                  transition={{ duration: 0.62, ease, delay: 0.32 + i * 0.07 }}
                >
                  {word}&nbsp;
                </motion.span>
              ))}
              <br />
              {'is still on record'.split(' ').map((word, i) => (
                <motion.span
                  key={`b-${word}`}
                  className="inline-block"
                  initial={{ filter: 'blur(8px)', opacity: 0, y: 18 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                  transition={{ duration: 0.62, ease, delay: 0.53 + i * 0.07 }}
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease, delay: 0.62 }}
              className="mt-6 max-w-[54ch] font-body text-[0.95rem] leading-relaxed text-[var(--text-secondary)] md:mt-7 md:text-lg"
            >
              Strata rebuilds every published version of a project&apos;s site and docs, diffs them in
              order, and checks every material claim that survived against Base, so an edit made
              quietly still leaves a permanent record
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease, delay: 0.8 }}
              className="mt-8 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4"
            >
              <PrimaryCta />
              <a
                href="#ledger"
                className="rounded-full border border-[var(--rule-strong)] px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:border-[var(--ink-primary)] md:py-3 md:text-xs"
              >
                See a finished ledger
              </a>
            </motion.div>
          </div>
          <HeroLedgerCard
            ledger={ledger.data}
            isLoading={ledger.isLoading}
            isError={ledger.isError}
          />
        </div>
      </div>
    </Section>
  );
}

export { HeroDiff };
