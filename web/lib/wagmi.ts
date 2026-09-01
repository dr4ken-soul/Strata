import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, walletConnect } from '@wagmi/connectors';

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

/**
 * Builds the wagmi config for Base mainnet with injected and WalletConnect connectors.
 * @returns the wagmi config used by the app-wide WagmiProvider
 */
export function createWagmiConfig() {
  const connectors = wcProjectId
    ? [injected(), walletConnect({ projectId: wcProjectId, showQrModal: true })]
    : [injected()];

  return createConfig({
    chains: [base],
    connectors,
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
    },
  });
}
