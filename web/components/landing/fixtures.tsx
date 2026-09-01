'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Section, VerdictChip } from '@/components/ui';
import { fetchJson } from '@/lib/fetcher';
import type { FixtureSummary } from '@/lib/types';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * One fixture bento cell, name, role tag, why line and the three real stats
 * read from the stored run.
 * @param props.fixture - the fixture summary from the API
 * @param props.index - the grid position, drives the stagger delay
 * @returns the fixture cell element
 */
function FixtureCell({ fixture, index }: { fixture: FixtureSummary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease, delay: index * 0.08 }}
      viewport={{ once: false, amount: 0.1 }}
      className="flex min-h-[220px] flex-col justify-between rounded-[8px] border border-[var(--rule)] bg-[var(--bg-surface)] p-5 transition-[transform,border-color] duration-[200ms] hover:-translate-y-0.5 hover:border-[var(--rule-strong)] md:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-xl font-semibold text-[var(--ink-primary)] md:text-2xl">
          {fixture.name}
        </p>
        <span className="whitespace-nowrap rounded-full border border-[var(--rule)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {fixture.role}
        </span>
      </div>
      <p className="mt-3 font-body text-sm leading-relaxed text-[var(--text-secondary)]">{fixture.why}</p>
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--rule)] pt-4">
        {[
          { key: 'CAPTURES', value: fixture.captureCount },
          { key: 'MATERIAL', value: fixture.materialChangeCount },
          { key: 'BROKEN', value: fixture.brokenCount },
        ].map((stat) => (
          <div key={stat.key}>
            <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {stat.key}
            </p>
            <p className="mono mt-1 text-base text-[var(--ink-primary)] md:text-lg">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <VerdictChip
          verdict={
            fixture.brokenCount > 0 ? 'broken' : fixture.status === 'partial' ? 'unverifiable' : 'held'
          }
        />
      </div>
    </motion.div>
  );
}

/**
 * The fixtures bento, five stored runs including the two clean controls.
 * @returns the fixtures section
 */
export function Fixtures() {
  const { data } = useQuery<FixtureSummary[]>({
    queryKey: ['fixtures'],
    queryFn: () => fetchJson<FixtureSummary[]>('/api/fixtures'),
  });

  const spans = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'];

  return (
    <Section band={4} density="dense" className="relative py-24 md:py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-10">
        <div className="mb-10">
          <p className="mono mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
            Run against real projects
          </p>
          <h2 className="max-w-[24ch] font-display text-[1.9rem] font-semibold tracking-[-0.02em] text-[var(--ink-primary)] md:text-[2.6rem]">
            Five ledgers, including the ones that come back clean
          </h2>
          <p className="mt-3 max-w-[62ch] font-body text-sm text-[var(--text-secondary)]">
            A tool that can only accuse is not an instrument, two of these five are controls and
            Strata is expected to find nothing material in them
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
          {(data ?? []).map((fixture, index) => (
            <div key={fixture.slug} className={spans[index] ?? 'lg:col-span-4'}>
              <FixtureCell fixture={fixture} index={index} />
            </div>
          ))}
          {data === undefined && (
            <div className="lg:col-span-12">
              <div className="skeleton-bar h-24 w-full rounded-[8px]" />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.4 }}
            viewport={{ once: false, amount: 0.1 }}
            className="flex flex-col gap-4 rounded-[8px] border border-[var(--rule)] bg-[var(--bg-secondary)] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8 lg:col-span-12"
          >
            <p className="max-w-[70ch] font-body text-sm text-[var(--text-secondary)]">
              Every figure on this page comes from a stored run, the same pipeline a judge can
              trigger live from the app
            </p>
            <a
              href="/api/fixtures"
              className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:text-[var(--accent)]"
            >
              Open the fixture runs
            </a>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
