'use client';

import { motion } from 'motion/react';
import { Section } from '@/components/ui';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The problem section, a full width word by word statement over the field at
 * sparse density.
 * @returns the problem section
 */
export function Problem() {
  return (
    <Section band={1} density="sparse" className="relative flex items-center py-28 md:py-40">
      <div className="relative z-10 w-full px-5 md:px-10 lg:px-16">
        <h2 className="max-w-[18ch] text-left font-display font-semibold leading-[0.96] tracking-[-0.035em] text-[var(--ink-primary)] text-[clamp(2rem,7vw,5.25rem)]">
          {'A website edit leaves no trace on the chain'.split(' ').map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              className="inline-block"
              initial={{ filter: 'blur(8px)', opacity: 0, y: 18 }}
              whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              viewport={{ once: false, amount: 0.2 }}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h2>
        <motion.div
          className="mt-10 h-px w-full bg-[var(--rule)] md:mt-12"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.5 }}
          viewport={{ once: false, amount: 0.1 }}
          style={{ transformOrigin: 'left' }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          viewport={{ once: false, amount: 0.1 }}
          className="mono mt-5 max-w-[64ch] text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] md:text-[11px]"
        >
          Projects revise, delete and rephrase, Strata keeps the old copy
        </motion.p>
      </div>
    </Section>
  );
}

interface MechanismLayer {
  index: string;
  title: string;
  description: string;
  owner: string;
}

const MECHANISM_LAYERS: MechanismLayer[] = [
  {
    index: '01',
    title: 'Ingest',
    description:
      'Every archived capture of the site and docs, plus every commit that touched the docs repository, each section hashed so only a section that genuinely changed is ever fetched in full',
    owner: 'Deterministic',
  },
  {
    index: '02',
    title: 'Diff',
    description:
      'Captures are ordered by time and compared pairwise, the change set is produced by code, no model touches this step',
    owner: 'Deterministic',
  },
  {
    index: '03',
    title: 'Classify',
    description:
      'The model reads one diff at a time and does one job, mark the change cosmetic or material and extract the claim inside it as a structured record, it never decides whether the claim is true',
    owner: 'Model',
  },
  {
    index: '04',
    title: 'Verify',
    description:
      'Every material claim that can be checked is checked against Base, supply against the token contract, allocation against the live holder set, locks against the locker, burns against the burn address, ownership and mint authority against the contract itself',
    owner: 'Deterministic',
  },
  {
    index: '05',
    title: 'Attest',
    description:
      'Each verified or broken promise is written as an attestation on Base, so the record outlives the page being edited or deleted',
    owner: 'Onchain',
  },
];

/**
 * The mechanism section, five layers as rules and negative space rather than
 * boxes, each with a deterministic, model or onchain owner tag.
 * @returns the mechanism section
 */
export function Mechanism() {
  return (
    <Section
      band={2}
      density="dense"
      className="relative bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] py-24 backdrop-blur-[2px] md:py-32"
    >
      <div className="relative z-10 mx-auto max-w-4xl px-5 md:px-10">
        <p className="mono mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
          How a ledger is built
        </p>
        <h2 className="max-w-[22ch] font-display text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)] md:text-[2.6rem]">
          The engine owns the numbers, the model only reads prose
        </h2>
        <div className="mt-14 flex flex-col">
          {MECHANISM_LAYERS.map((layer, index) => (
            <motion.div
              key={layer.index}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: index * 0.09 }}
              viewport={{ once: false, amount: 0.1 }}
              className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-[var(--rule)] py-6 transition-colors duration-[200ms] last:border-b hover:bg-[var(--bg-secondary)]/60 md:grid-cols-[4rem_1fr] md:gap-8 md:py-7"
            >
              <span className="mono pt-1 text-[11px] tracking-[0.14em] text-[var(--text-muted)]">
                {layer.index}
              </span>
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-primary)] md:text-xs">
                  {layer.title}
                </p>
                <p className="mt-2 max-w-[62ch] font-body text-sm leading-relaxed text-[var(--text-secondary)] md:text-[0.95rem]">
                  {layer.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--rule)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {layer.owner}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
