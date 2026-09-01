import { fileURLToPath } from 'url';

const emptyStub = fileURLToPath(new URL('./stubs/empty.js', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ethereum-attestation-service/eas-sdk'],
  webpack: (config) => {
    // @wagmi/connectors' barrel lazily imports optional SDKs (Coinbase Wallet,
    // Base smart account, CDP, x402 payments) whose sub-dependencies are
    // missing in this install. Strata only uses the `injected` and
    // `walletConnect` connectors, so these resolve to an empty module; the
    // corresponding connector code paths are never executed.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@coinbase/wallet-sdk': emptyStub,
      '@base-org/account': emptyStub,
      '@coinbase/cdp-sdk': emptyStub,
      '@x402/evm': emptyStub,
      '@x402/evm/upto/client': emptyStub,
      '@x402/evm/exact/client': emptyStub,
      '@x402/core/client': emptyStub,
      '@x402/svm/exact/client': emptyStub,
    };
    return config;
  },
};

export default nextConfig;
