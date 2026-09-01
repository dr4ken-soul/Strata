'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { AnimatePresence, motion } from 'motion/react';
import { WalletPill } from './wallet-pill';

type ModalState = 'closed' | 'connecting' | 'error';

interface WalletContextValue {
  openModal: () => void;
}

const WalletContext = createContext<WalletContextValue>({ openModal: () => undefined });

/**
 * Gives every connect entry point one shared openModal handler, none of them
 * calls wagmi connect directly.
 * @param props.children - the wrapped page content
 * @returns the wallet context provider plus the rendered modal and pill
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { connect, connectors } = useConnect();
  const router = useRouter();

  const openModal = useCallback(() => {
    setErrorMessage(null);
    setModalState('connecting');
    const connector = connectors[0];
    if (!connector) {
      setErrorMessage('No wallet connector available in this browser');
      setModalState('error');
      return;
    }
    connect(
      { connector },
      {
        onSuccess: () => {
          setModalState('closed');
          router.push('/app');
        },
        onError: (error: Error) => {
          setErrorMessage(error.message);
          setModalState('error');
        },
      },
    );
  }, [connect, connectors, router]);

  return (
    <WalletContext.Provider value={{ openModal }}>
      {children}
      <AnimatePresence>
        {modalState !== 'closed' && (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-[rgba(16,20,24,0.4)] p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Connect wallet"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[340px] rounded-[8px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-6"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Connect wallet
              </p>
              {modalState === 'connecting' && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="skeleton-bar h-3 w-3/4 rounded-[2px]" />
                  <div className="skeleton-bar h-3 w-1/2 rounded-[2px]" />
                  <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
                    Approve the request in your wallet, connecting cannot be dismissed mid approval.
                  </p>
                </div>
              )}
              {modalState === 'error' && (
                <div className="mt-4 flex flex-col gap-4">
                  <p className="font-body text-sm text-[var(--accent)]">
                    {errorMessage ?? 'Connection failed'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={openModal}
                      className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#fbfcfb] hover:bg-[var(--accent-hover)] transition-colors duration-[140ms]"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setModalState('closed')}
                      className="rounded-full border border-[var(--rule-strong)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-primary)] transition-colors duration-[140ms]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <WalletPill />
    </WalletContext.Provider>
  );
}

/**
 * Accessor for the shared connect modal entry point.
 * @returns the wallet context
 */
export function useWalletModal(): WalletContextValue {
  return useContext(WalletContext);
}
