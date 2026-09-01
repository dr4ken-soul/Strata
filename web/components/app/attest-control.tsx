'use client';

import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

type AttestState =
  | 'idle'
  | 'wallet-pending'
  | 'submitted'
  | 'confirmed'
  | 'failed';

interface RunForAttest {
  slug: string;
  brokenCount: number;
  materialChangeCount: number;
}

/**
 * The attest control on the app ledger. Writes the run verdicts to Base through
 * EAS from the engine hot wallet, requested with the connected wallet present.
 * It never optimistically renders a confirmed state before the receipt.
 * @param props.run - the stored run whose verdicts to attest
 * @returns the attest control element
 */
export function AttestControl({ run }: { run: RunForAttest }) {
  const [state, setState] = useState<AttestState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [revertReason, setRevertReason] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const attest = () => {
    if (!isConnected || !address) {
      setState('failed');
      setRevertReason('Connect a wallet first, attestations are requested from the app');
      return;
    }
    setRevertReason(null);
    setState('wallet-pending');
    switchChain(
      { chainId: base.id },
      {
        onSuccess: () => {
          void fetch('/api/ledger', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              action: 'attest',
              slug: run.slug,
              requester: address,
            }),
          })
            .then(async (response) => {
              const payload = (await response.json()) as { txHash?: string; error?: string };
              if (!response.ok || !payload.txHash) {
                throw new Error(payload.error ?? 'attestation was rejected by the engine');
              }
              setTxHash(payload.txHash);
              setState('submitted');
            })
            .catch((err: unknown) => {
              setRevertReason(err instanceof Error ? err.message : 'attestation failed');
              setState('failed');
            });
        },
        onError: (error: Error) => {
          setRevertReason(error.message);
          setState('failed');
        },
      },
    );
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={attest}
        disabled={state === 'wallet-pending' || state === 'submitted'}
        className="rounded-full bg-[var(--accent)] px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fbfcfb] transition-colors duration-[140ms] hover:bg-[var(--accent-hover)] disabled:opacity-50 md:py-3 md:text-xs"
      >
        Write to Base
      </button>
      {state === 'wallet-pending' && (
        <p className="mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
          WALLET PENDING, APPROVE IN YOUR WALLET
        </p>
      )}
      {state === 'submitted' && txHash && (
        <p className="mono text-[10px] tracking-[0.1em] text-[var(--text-secondary)]">
          SUBMITTED {txHash} ·{' '}
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)]"
          >
            VIEW ON BASESCAN
          </a>
        </p>
      )}
      {state === 'failed' && (
        <>
          <p className="mono text-[10px] tracking-[0.1em] text-[var(--accent)]">
            FAILED · {revertReason}
          </p>
          <button
            onClick={attest}
            className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-primary)]"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
