'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Section } from '@/components/ui';
import { fetchJson } from '@/lib/fetcher';

const ease = [0.16, 1, 0.3, 1] as const;

interface MetricsResponse {
  available: boolean;
  projectsOnRecord?: string;
  materialChanges?: string;
  attestations?: string;
}

/**
 * Counts a number up from zero over 1.5s with an ease out curve, replaying on
 * each re entry into the viewport.
 * @param props.target - the target value as a string number
 * @param props.active - whether the count should run
 * @returns the current displayed value
 */
function useCountUp(target: string | undefined, active: boolean): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);
  useEffect(() => {
    if (!active || target === undefined) return undefined;
    const end = Number(target);
    if (!Number.isFinite(end)) return undefined;
    const start = performance.now();
    const duration = 1500;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(end * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, active]);
  return value;
}

/**
 * One live metric column, counting from zero to the fetched registry value.
 * @param props.label - the metric label
 * @param props.value - the live value, or undefined while loading or on failure
 * @param props.delay - the stagger delay in seconds
 * @returns the metric column element
 */
function MetricColumn({
  label,
  value,
  delay,
}: {
  label: string;
  value: string | undefined;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.1 });
  const displayed = useCountUp(value, inView);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease, delay }}
      viewport={{ once: false, amount: 0.1 }}
      className="text-center md:border-r md:border-[var(--rule)] md:px-8 md:last:border-r-0"
    >
      {value === undefined ? (
        <div className="skeleton-bar mx-auto h-9 w-24 rounded-[2px]" />
      ) : (
        <p
          className="font-display text-[2.75rem] font-semibold leading-none tracking-[-0.03em] text-[var(--ink-primary)] md:text-[3.75rem]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {displayed}
        </p>
      )}
      <p className="mono mt-3 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </p>
    </motion.div>
  );
}

/**
 * The live metrics section, three counters read live from the Strata registry
 * contract on Base, never constants, with a retry control on failure.
 * @returns the metrics section
 */
export function Metrics() {
  const { data, refetch } = useQuery<MetricsResponse>({
    queryKey: ['metrics'],
    queryFn: () => fetchJson<MetricsResponse>('/api/metrics'),
    refetchInterval: 60_000,
  });

  const available = data?.available === true;

  return (
    <Section
      band={6}
      density="dense"
      className="relative bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] py-20 backdrop-blur-[2px] md:py-28"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-10">
        <p className="mono mb-12 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Live on Base
        </p>
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-3 md:gap-0">
          <MetricColumn label="Projects on record" value={available ? data?.projectsOnRecord : undefined} delay={0} />
          <MetricColumn label="Material changes found" value={available ? data?.materialChanges : undefined} delay={0.15} />
          <MetricColumn label="Attestations on Base" value={available ? data?.attestations : undefined} delay={0.3} />
        </div>
        {!available && (
          <div className="mt-6 text-center">
            <button
              onClick={() => void refetch()}
              className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              Retry registry read
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}

/**
 * Thin wrapper so the metrics section keeps one query key and a retry path.
 * @returns the metrics query state
 */
