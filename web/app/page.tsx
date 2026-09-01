import { Masthead } from '@/components/masthead';
import { GrainOverlay } from '@/components/grain';
import { Footer } from '@/components/footer';
import { StrataField } from '@/components/strata-field';
import { WalletProvider } from '@/components/wallet-provider';
import { Hero } from '@/components/landing/hero';
import { Problem, Mechanism } from '@/components/landing/problem-mechanism';
import { LedgerSection } from '@/components/landing/ledger-section';
import { Fixtures } from '@/components/landing/fixtures';
import { Coverage } from '@/components/landing/coverage';
import { Metrics } from '@/components/landing/metrics';
import { FinalCta } from '@/components/landing/final-cta';

/**
 * The public landing page, composed section by section over the Strata Field.
 * No wallet state lives on the landing page, every connect entry point goes
 * through the shared modal.
 * @returns the landing page
 */
export default function LandingPage() {
  return (
    <WalletProvider>
      <StrataField />
      <GrainOverlay />
      <Masthead />
      <main className="relative z-10">
        <Hero />
        <Problem />
        <Mechanism />
        <LedgerSection />
        <Fixtures />
        <Coverage />
        <Metrics />
        <FinalCta />
      </main>
      <Footer />
    </WalletProvider>
  );
}
