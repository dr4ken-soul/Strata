'use client';

/**
 * The app error boundary, a branded recovery screen with retry and return
 * home actions, never a raw stack trace or a blank screen.
 * @param props.error - the caught error
 * @param props.reset - the retry handler provided by Next
 * @returns the branded recovery screen
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
        Something failed, recovery available
      </p>
      <p className="max-w-[46ch] font-body text-sm text-[var(--text-secondary)]">
        A provider or route error stopped this view. Retry the view or return home, the ledger
        record is unaffected.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#fbfcfb] transition-colors duration-[140ms] hover:bg-[var(--accent-hover)]"
        >
          Retry
        </button>
        <a
          href="/"
          className="rounded-full border border-[var(--rule-strong)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:border-[var(--ink-primary)]"
        >
          Return home
        </a>
      </div>
      {/* the digest is surfaced without a stack trace */}
      <span className="sr-only">{error.digest ?? ''}</span>
    </div>
  );
}
