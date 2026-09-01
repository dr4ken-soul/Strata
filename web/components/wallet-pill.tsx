'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { AnimatePresence, motion } from 'motion/react';
import { truncateAddress } from '@/lib/format';

/**
 * The fixed wallet pill. Disconnected it is the connect trigger, connected it
 * becomes the menu trigger with copy, explorer and disconnect actions.
 * @returns the wallet pill element
 */
export function WalletPill() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isConnected) setMenuOpen(false);
  }, [isConnected]);

  if (!isConnected || !address) {
    return (
      <button
        id="strata-wallet-pill"
        className="fixed right-4 top-[52px] z-[200] rounded-full border border-[var(--rule-strong)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:border-[var(--accent)] hover:text-[var(--accent)] md:right-8 md:top-[60px] md:px-5 md:py-2.5 md:text-xs"
      >
        Connect wallet
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-[52px] z-[200] md:right-8 md:top-[60px]">
      <button
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-surface)] pl-3 pr-2.5 py-2 transition-colors duration-[140ms] hover:border-[var(--accent)]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--verified)]" />
        <span className="mono text-[11px] tracking-[0.1em] text-[var(--ink-primary)]">
          {truncateAddress(address)}
        </span>
        <svg
          className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-[140ms] ${menuOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 mt-2 w-[280px] rounded-[8px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-4"
          >
            <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--verified)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Wallet connected
              </span>
            </div>
            <div className="grid gap-3 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="mono break-all text-xs text-[var(--ink-primary)]">{address}</span>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(address).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    });
                  }}
                  className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--ink-primary)]"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <a
                href={`https://basescan.org/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--accent)]"
              >
                View on Basescan
              </a>
              <button
                onClick={() => {
                  disconnect();
                  router.replace('/');
                }}
                className="text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders children only while the wallet is connected, a branded skeleton while
 * reconnecting, and nothing (so the landing page shows) when disconnected.
 * Never redirects and never replaces the URL while hydrating.
 * @param props.children - the protected route content
 * @returns the gated content or the skeleton
 */
export function WalletGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  if (isConnected) return <>{children}</>;
  if (isConnecting || isReconnecting) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex w-full max-w-[320px] flex-col gap-3">
          <div className="skeleton-bar h-3 w-2/3 rounded-[2px]" />
          <div className="skeleton-bar h-3 w-full rounded-[2px]" />
          <div className="skeleton-bar h-3 w-1/2 rounded-[2px]" />
        </div>
      </div>
    );
  }
  return null;
}
