import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

/* Logo slot: replace with public/logo.svg once provided */
/* Favicon slot: replace with public/favicon.ico once provided */

export const metadata: Metadata = {
  title: 'Strata, the promise ledger',
  description:
    "Projects rarely lie once, they revise. Strata keeps every old copy of a project's site and docs, diffs it, and holds what is left against Base.",
};

/**
 * Root layout, wraps the app in the wallet and query providers.
 * @param props.children - the rendered route tree
 * @returns the root html shell
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
