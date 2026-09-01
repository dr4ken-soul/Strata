'use client';

import { motion } from 'motion/react';
import { PrimaryCta, Section } from '@/components/ui';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The final CTA, the Strata Field returns to full opacity for the closing
 * viewport, one primary action intent only.
 * @returns the final CTA section
 */
export function FinalCta() {
  return (
    <Section
      band={7}
      density="hero"
      className="relative flex items-center justify-center overflow-hidden py-32 md:py-44"
    >
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 text-center md:px-10">
        <motion.h2
          initial={{ filter: 'blur(8px)', opacity: 0, y: 20 }}
          whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease }}
          viewport={{ once: false, amount: 0.1 }}
          className="max-w-[16ch] font-display text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink-primary)] md:text-[4rem]"
        >
          Put a project on record
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease, delay: 0.15 }}
          viewport={{ once: false, amount: 0.1 }}
          className="mt-5 max-w-[48ch] font-body text-base text-[var(--text-secondary)]"
        >
          Paste a token address or a docs URL, Strata builds the ledger and writes what it finds to
          Base
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease, delay: 0.3 }}
          viewport={{ once: false, amount: 0.1 }}
          className="mt-9"
        >
          <PrimaryCta />
        </motion.div>
      </div>
    </Section>
  );
}
