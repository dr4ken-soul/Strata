'use client';

import { useRouter } from 'next/navigation';

type Stage = 'queued' | 'ingesting' | 'diffing' | 'classifying' | 'verifying' | 'complete' | 'partial' | 'failed';

const STAGES: { key: Stage; label: string }[] = [
  { key: 'ingesting', label: 'Ingest' },
  { key: 'diffing', label: 'Diff' },
  { key: 'classifying', label: 'Classify' },
  { key: 'verifying', label: 'Verify' },
  { key: 'complete', label: 'Attest' },
];

/**
 * The five stage live checklist for an executing run, each stage showing state
 * as it arrives.
 * @param props.status - the current run status
 * @param props.slug - the run slug for the open link
 * @returns the stage checklist element
 */
export function StageChecklist({ status, slug }: { status: Stage | null; slug: string }) {
  const router = useRouter();
  const currentIndex = status ? STAGES.findIndex((entry) => entry.key === status) : -1;
  return (
    <div className="mt-4 flex flex-col border-t border-[var(--rule)]">
      {STAGES.map((stage, index) => {
        const state =
          currentIndex === -1
            ? 'pending'
            : index < currentIndex
              ? 'done'
              : index === currentIndex
                ? 'active'
                : 'pending';
        return (
          <div key={stage.key} className="flex items-center gap-3 border-b border-[var(--rule)] py-4">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  state === 'done'
                    ? 'var(--verified)'
                    : state === 'active'
                      ? 'var(--accent)'
                      : 'var(--rule-strong)',
              }}
            />
            <span className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-primary)]">
              {stage.label}
            </span>
            {state === 'active' && (
              <span className="mono ml-auto text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
                RUNNING
              </span>
            )}
            {state === 'done' && (
              <span className="mono ml-auto text-[10px] tracking-[0.1em] text-[var(--verified)]">
                DONE
              </span>
            )}
          </div>
        );
      })}
      <button
        onClick={() => router.push(`/app/ledger/${slug}`)}
        className="mono mt-4 self-start text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
      >
        Open the run
      </button>
    </div>
  );
}
