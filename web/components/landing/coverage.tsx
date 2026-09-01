'use client';

import { motion } from 'motion/react';
import { Section } from '@/components/ui';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The coverage and limits section, both image slots replaced by an evidence
 * stack since no photography belongs anywhere near this product.
 * @returns the coverage section
 */
export function Coverage() {
  const cards = [
    {
      label: 'SOURCE',
      value: 'Archive captures plus public docs repository history',
      glyph: 'M2 8h10M2 4h10M2 12h6',
    },
    {
      label: 'VERIFIED AGAINST',
      value: 'Base mainnet state at the block printed on the row',
      glyph: 'M7 1v6l4 2',
    },
    {
      label: 'NOT SCORED',
      value: 'Any claim with no onchain equivalent, marked, never guessed',
      glyph: 'M2 7l3 3 6-6',
    },
    {
      label: 'COVERAGE',
      value: 'Stated per ledger as a percentage of the window with captures',
      glyph: 'M1 11h3V6h4V2h5',
    },
  ];

  return (
    <Section band={5} density="sparse" className="relative py-24 md:py-32">
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-5 md:px-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease, delay: 0.15 }}
          viewport={{ once: false, amount: 0.1 }}
        >
          <h2 className="max-w-[16ch] font-display text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.025em] text-[var(--ink-primary)] md:text-[3rem]">
            What Strata cannot see, printed on the ledger
          </h2>
          <p className="mt-5 max-w-[58ch] font-body text-base leading-relaxed text-[var(--text-secondary)]">
            Archive coverage is uneven, a project whose docs render entirely in the browser and
            keeps no public repository returns partial coverage rather than a verdict, and a claim
            with no onchain equivalent, a partnership or a roadmap date, is recorded as a promise
            with no proof rather than scored, every ledger states its own coverage as a percentage
            of the window that actually has captures
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease, delay: 0.3 + index * 0.08 }}
              viewport={{ once: false, amount: 0.1 }}
              className="rounded-[6px] border border-[var(--rule)] bg-[var(--bg-surface)] p-5"
            >
              <svg
                className="h-6 w-6 text-[var(--text-muted)]"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                aria-hidden="true"
              >
                <path d={card.glyph} />
              </svg>
              <p className="mono mt-4 text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {card.label}
              </p>
              <p className="mt-1.5 font-body text-sm leading-snug text-[var(--ink-primary)]">
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
