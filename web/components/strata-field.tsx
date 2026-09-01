'use client';

import { useEffect, useRef, useState } from 'react';

type Density = 'hero' | 'sparse' | 'dense';

const OPACITY_BY_DENSITY: Record<Density, number> = {
  hero: 0.34,
  sparse: 0.22,
  dense: 0.1,
};

const Y0 = 40;
const Y1 = 2360;

/**
 * The Strata Field, a fixed coded SVG of vertical archival bands that persists
 * behind every landing section, with one active band highlighted as the reader
 * scrolls. It is never an image file and never a canvas particle system.
 * The active band arrives via the strata:band custom event from Section.
 * @returns the fixed background field element
 */
export function StrataField() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const densityRef = useRef<Density>('hero');
  const opacityRef = useRef(0.34);
  const [bandCount, setBandCount] = useState(34);
  const [activeBand, setActiveBand] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setBandCount(mobile ? 18 : 34);
    };
    update();
    let timeout: ReturnType<typeof setTimeout>;
    const debounced = () => {
      clearTimeout(timeout);
      timeout = setTimeout(update, 150);
    };
    window.addEventListener('resize', debounced);
    return () => {
      window.removeEventListener('resize', debounced);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const onBand = (event: Event) => {
      const detail = (event as CustomEvent<{ band: number; density: Density }>).detail;
      if (!detail) return;
      densityRef.current = detail.density;
      setActiveBand(detail.band);
    };
    window.addEventListener('strata:band', onBand);
    return () => window.removeEventListener('strata:band', onBand);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const step = () => {
      const svg = svgRef.current;
      if (svg) {
        const target = OPACITY_BY_DENSITY[densityRef.current];
        const current = opacityRef.current;
        const next = current + (target - current) * 0.04;
        opacityRef.current = next;
        svg.style.opacity = next.toFixed(4);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const bands = Array.from({ length: bandCount }, (_, i) => i);
  const step = (Y1 - Y0) / (bandCount - 1);
  const flatOpacity = 0.16;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      viewBox="0 0 1400 2400"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: reduced ? flatOpacity : OPACITY_BY_DENSITY[densityRef.current],
      }}
    >
      {bands.map((i) => {
        const y = Y0 + i * step;
        const active = i === activeBand % bandCount;
        return (
          <g key={i}>
            <line
              x1={Math.round(40 + (i * 1320) / bandCount)}
              y1={Y0}
              x2={Math.round(40 + (i * 1320) / bandCount)}
              y2={Y1}
              stroke={active ? 'var(--accent)' : 'var(--rule)'}
              strokeWidth={active && !reduced ? 2 : 1}
              style={{
                transition: reduced
                  ? 'none'
                  : 'stroke 400ms var(--ease-out), stroke-width 400ms var(--ease-out)',
              }}
            />
            <rect
              x={active ? 1392 : 1400}
              y={y - 3}
              width={6}
              height={6}
              fill="var(--accent)"
              style={{
                opacity: active ? 1 : 0,
                transition: reduced
                  ? 'none'
                  : 'opacity 240ms var(--ease-out), x 240ms var(--ease-out)',
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
