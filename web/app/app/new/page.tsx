'use client';

import { WalletGate } from '@/components/wallet-pill';
import { Masthead } from '@/components/masthead';
import { StrataBackdrop } from '@/components/public-shell';
import { RunForm } from '@/components/app/run-form';

/**
 * The build ledger page, single column form with live stage progress.
 * @returns the new ledger page
 */
export default function NewLedgerPage() {
  return (
    <WalletGate>
      <StrataBackdrop />
      <Masthead />
      <main className="relative z-10 mx-auto min-h-[100dvh] max-w-[560px] px-5 pb-24 pt-28">
        <h1 className="font-display text-[1.75rem] font-semibold text-[var(--ink-primary)] md:text-2xl">
          Build a ledger
        </h1>
        <RunForm />
      </main>
    </WalletGate>
  );
}
