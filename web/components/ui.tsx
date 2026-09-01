'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useWalletModal } from './wallet-provider';

/**
 * Shared primary CTA, connect gated via the shared openModal handler so every
 * entry point on the page behaves identically.
 * @param props.label - optional label override, defaults to RUN A LEDGER
 * @param props.className - extra classes for layout overrides
 * @returns the primary call to action button
 */
export function PrimaryCta({
  label = 'Run a ledger',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const { openModal } = useWalletModal();
  return (
    <button
      onClick={openModal}
      className={`group flex items-center gap-3 rounded-full bg-[var(--accent)] pl-6 pr-2.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fbfcfb] transition-colors duration-[140ms] hover:bg-[var(--accent-hover)] md:py-3 md:text-xs ${className}`}
    >
      <span>{label}</span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-px">
        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3 11L11 3M11 3H5M11 3v6" />
        </svg>
      </span>
    </button>
  );
}

/**
 * A landing section wrapper carrying the band index and density the Strata
 * Field reads, with an IntersectionObserver that announces the active band.
 * @param props.band - the data-band index
 * @param props.density - hero, sparse or dense
 * @param props.className - section classes
 * @param props.children - section content
 * @returns the section element
 */
export function Section({
  band,
  density,
  className = '',
  id,
  children,
}: {
  band: number;
  density: 'hero' | 'sparse' | 'dense';
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`section[data-band="${band}"]`);
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.dispatchEvent(
              new CustomEvent('strata:band', { detail: { band, density } }),
            );
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [band, density]);

  return (
    <section id={id} data-band={band} data-density={density} className={className}>
      {children}
    </section>
  );
}

/**
 * Rule reveal used on every hairline divider, scaleX 0 to 1 from the left,
 * replaying on each entry per the viewport once false rule.
 * @param props.className - extra rule classes
 * @returns the animated hairline
 */
export function RuleReveal({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`h-px w-full bg-[var(--rule)] ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: false, amount: 0.1 }}
      style={{ transformOrigin: 'left' }}
    />
  );
}

/**
 * Verdict chip carried by an inline SVG glyph plus a text label so nothing
 * depends on colour alone. Used on the ledger plot and the fixture cells.
 * @param props.verdict - the verdict to render, or null for no verdict yet
 * @returns the chip element
 */
export function VerdictChip({ verdict }: { verdict: 'held' | 'broken' | 'unverifiable' | null }) {
  if (!verdict) return null;
  const config = {
    held: { color: 'var(--verified)', label: 'HELD' },
    broken: { color: 'var(--accent)', label: 'BROKEN' },
    unverifiable: { color: 'var(--unverifiable)', label: 'UNVERIFIABLE' },
  } as const;
  const { color, label } = config[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em]"
      style={{ borderColor: color, color }}
    >
      {verdict === 'held' && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" />
          <path d="M4 6.2l1.4 1.4L8.2 4.8" />
        </svg>
      )}
      {verdict === 'broken' && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" />
          <path d="M2.7 9.3L9.3 2.7" />
        </svg>
      )}
      {verdict === 'unverifiable' && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" />
          <path d="M6 3.6v3.2M6 8.4v.1" />
        </svg>
      )}
      {label}
    </span>
  );
}
