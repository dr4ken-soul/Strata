'use client';

import { useMemo, useState } from 'react';
import { formatQuarter } from '@/lib/format';
import type { ClaimRecord, LedgerRun, Verification } from '@/lib/types';
import { Plot, type Marker } from './ledger-plot-body';

interface Row {
  category: string;
  markers: Marker[];
  revised: boolean;
}

/**
 * The promise timeline. One row per claim category, one marker per published
 * version positioned on a real time axis derived from the run's capture window,
 * a dashed labelled connector where a claim changed, and a quote panel that
 * opens the published quote beside the chain reading. Markers are keyboard
 * reachable buttons with a 44px hit area.
 * @param props.run - the stored ledger run to plot
 * @returns the ledger plot element
 */
export function LedgerPlot({ run }: { run: LedgerRun }) {
  const [selected, setSelected] = useState<Marker | null>(null);

  const { rows, quarters } = useMemo(() => buildPlot(run), [run]);
  return (
    <Plot
      run={run}
      rows={rows}
      quarters={quarters}
      selected={selected}
      setSelected={setSelected}
    />
  );
}

/**
 * Derives the plot rows and quarter labels from a stored run, deterministically.
 * @param run - the stored ledger run
 * @returns one row per claim category with positioned markers, plus axis labels
 */
function buildPlot(run: LedgerRun): { rows: Row[]; quarters: string[] } {
  const span = Math.max(1, run.windowEnd - run.windowStart);
  const byCategory = new Map<string, ClaimRecord[]>();
  for (const claim of run.claims) {
    const list = byCategory.get(claim.category) ?? [];
    list.push(claim);
    byCategory.set(claim.category, list);
  }
  const verificationByClaim = new Map<string, Verification>();
  for (const verification of run.verifications) {
    verificationByClaim.set(verification.claimId, verification);
  }
  const builtRows: Row[] = [];
  for (const [category, claims] of byCategory) {
    const sorted = [...claims].sort((a, b) => a.capturedAt - b.capturedAt);
    const markers: Marker[] = sorted.map((claim) => ({
      claim,
      verification: verificationByClaim.get(claim.claimId),
      xPercent: ((claim.capturedAt - run.windowStart) / span) * 100,
    }));
    const revised = sorted.some((claim, index) => {
      if (index === 0) return false;
      const previous = sorted[index - 1];
      if (!previous) return false;
      return previous.valueAsWritten !== claim.valueAsWritten;
    });
    builtRows.push({ category, markers, revised });
  }
  const quarterCount = 4;
  const quarterLabels = Array.from({ length: quarterCount }, (_, i) =>
    formatQuarter(run.windowStart + (span * i) / (quarterCount - 1)),
  );
  return { rows: builtRows, quarters: quarterLabels };
}
