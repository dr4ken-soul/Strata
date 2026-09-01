/**
 * Renders the plot body, rows with markers and dashed revision connectors, the
 * time axis, and the quote panel for the selected marker.
 * @param props.run - the stored ledger run
 * @param props.rows - the derived plot rows
 * @param props.quarters - the time axis labels
 * @param props.selected - the currently selected marker, or null
 * @param props.setSelected - the marker selection handler
 * @returns the plot element
 */
import { AnimatePresence, motion } from 'motion/react';
import { formatQuarter } from '@/lib/format';
import type { ClaimRecord, LedgerRun, Verification } from '@/lib/types';

export interface Marker {
  claim: ClaimRecord;
  verification: Verification | undefined;
  xPercent: number;
}

export interface Row {
  category: string;
  markers: Marker[];
  revised: boolean;
}

export { Plot };

/**
 * Renders the plot body, rows with markers and dashed revision connectors, the
 * time axis, and the quote panel for the selected marker.
 * @param props.run - the stored ledger run
 * @param props.rows - the derived plot rows
 * @param props.quarters - the time axis labels
 * @param props.selected - the currently selected marker, or null
 * @param props.setSelected - the marker selection handler
 * @returns the plot element
 */
function Plot({
  run,
  rows,
  quarters,
  selected,
  setSelected,
}: {
  run: LedgerRun;
  rows: Row[];
  quarters: string[];
  selected: Marker | null;
  setSelected: (marker: Marker | null) => void;
}) {
  return (
    <div className="relative w-full overflow-x-auto md:overflow-visible">
      <div className="relative min-w-[720px] md:min-w-0">
        {rows.map((row) => (
          <div
            key={row.category}
            className="relative h-16 border-b border-[var(--rule)] last:border-b-0 md:h-[4.5rem]"
          >
            <div className="absolute left-0 top-1/2 w-28 -translate-y-1/2 pr-4 md:w-36">
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {row.category}
              </span>
            </div>
            <div className="absolute left-28 right-0 top-1/2 h-px bg-[var(--rule)] md:left-36" />
            {row.markers.map((marker, index) => {
              const previous = index > 0 ? row.markers[index - 1] : undefined;
              const changed =
                previous !== undefined &&
                previous.claim.valueAsWritten !== marker.claim.valueAsWritten;
              return (
                <div key={marker.claim.claimId}>
                  {changed && previous && (
                    <div
                      className="absolute top-1/2 h-px -translate-y-1/2 border-t border-dashed border-[var(--accent)]"
                      style={{
                        left: `${10 + marker.xPercent * 0.6}rem`,
                        width: `${((marker.xPercent - previous.xPercent) / 100) * 60 * 6.4}px`,
                      }}
                      role="img"
                      aria-label={`${row.category} revised from ${previous.claim.valueAsWritten} to ${marker.claim.valueAsWritten}`}
                    />
                  )}
                  <button
                    onClick={() => setSelected(marker)}
                    aria-label={`${row.category} claim, ${marker.claim.valueAsWritten}, published ${formatQuarter(marker.claim.capturedAt)}`}
                    className="absolute top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `calc(${10 + marker.xPercent * 0.6}rem)` }}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        background:
                          marker.verification?.verdict === 'broken'
                            ? 'var(--accent)'
                            : marker.verification?.verdict === 'held'
                              ? 'var(--verified)'
                              : 'var(--unverifiable)',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        <div className="relative mt-2">
          <motion.div
            className="absolute inset-x-0 bottom-0 h-px bg-[var(--rule-strong)]"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: false, amount: 0.1 }}
            style={{ transformOrigin: 'left' }}
          />
          <div className="flex justify-between pt-2">
            {quarters.map((quarter) => (
              <span key={quarter} className="mono text-[10px] tracking-[0.12em] text-[var(--text-muted)]">
                {quarter}
              </span>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && <QuotePanel marker={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
      {run.status === 'partial' && (
        <p className="mono mt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--unverifiable)]">
          PARTIAL COVERAGE · {run.coveragePercent}% OF THE WINDOW HAS CAPTURES
        </p>
      )}
    </div>
  );
}

/**
 * The quote panel for one selected marker, the published quote beside the
 * exact chain reading with its provenance.
 * @param props.marker - the selected marker
 * @param props.onClose - the close handler
 * @returns the quote panel element
 */
function QuotePanel({ marker, onClose }: { marker: Marker; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 rounded-[8px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-5"
    >
      <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {marker.claim.category} · PUBLISHED {formatQuarter(marker.claim.capturedAt)}
        </span>
        <button
          onClick={onClose}
          className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--ink-primary)]"
        >
          Close
        </button>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2">
        <div>
          <p className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Published</p>
          <blockquote className="mt-2 border-l-2 border-[var(--rule-strong)] pl-3 font-body text-sm text-[var(--ink-primary)]">
            {marker.claim.quote}
          </blockquote>
          <p className="mono mt-2 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
            VALUE AS WRITTEN: {marker.claim.valueAsWritten}
            {marker.claim.unit ? ` ${marker.claim.unit}` : ''}
          </p>
        </div>
        <div>
          <p className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Chain reading</p>
          {marker.verification ? (
            <div className="mt-2 font-body text-sm text-[var(--text-secondary)]">
              <p className="mono text-[10px] tracking-[0.1em]">
                {marker.verification.method} @ {marker.verification.contract ?? 'offchain'}
              </p>
              <p className="mono mt-1 text-[10px] tracking-[0.1em]">
                RETURNED {marker.verification.returnedValue} AT BLOCK {marker.verification.blockNumber}
              </p>
              <p
                className="mono mt-2 text-[10px] uppercase tracking-[0.16em]"
                style={{
                  color:
                    marker.verification.verdict === 'held'
                      ? 'var(--verified)'
                      : marker.verification.verdict === 'broken'
                        ? 'var(--accent)'
                        : 'var(--unverifiable)',
                }}
              >
                {marker.verification.verdict.toUpperCase()}
                {marker.verification.reason ? ` · ${marker.verification.reason}` : ''}
              </p>
            </div>
          ) : (
            <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
              No onchain equivalent, recorded as a promise with no proof.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

