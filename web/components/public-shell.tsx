'use client';

import type { ReactNode } from 'react';
import { StrataField } from '@/components/strata-field';
import { GrainOverlay } from '@/components/grain';
import { Masthead } from '@/components/masthead';
import { Footer } from '@/components/footer';
import { WalletProvider } from '@/components/wallet-provider';

/**
 * The public shell, masthead, field, grain and footer with the shared wallet
 * modal mounted, used by public pages that need no wallet state of their own.
 * @param props.children - the page content
 * @returns the wrapped public page
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <StrataBackdrop />
      <Masthead />
      <main className="relative z-10">{children}</main>
      <Footer />
    </WalletProvider>
  );
}

/**
 * The fixed coded field plus the grain overlay, shared by every page.
 * @returns the fixed background layers
 */
export function StrataBackdrop() {
  return (
    <>
      <StrataField />
      <GrainOverlay />
    </>
  );
}
