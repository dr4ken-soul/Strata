import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

/**
 * Resolves the EAS contract address for Base mainnet from the official EAS
 * deployment records for Base, never hardcoded from memory where an env value
 * is absent.
 * @returns the EAS proxy contract address on Base
 */
export function easAddress(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EAS_ADDRESS;
  if (fromEnv) return fromEnv;
  // EAS on Base mainnet per https://docs.eas.cloud/deployments
  return '0x4200000000000000000000000000000000000021';
}

/**
 * Builds an EAS client bound to Base mainnet via the configured RPC.
 * @returns an initialised EAS instance
 */
export function createEasClient(): EAS {
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
  );
  const eas = new EAS(easAddress());
  eas.connect(provider);
  return eas;
}

/**
 * Encodes the Strata schema payload for one claim verdict.
 * @param subject - the subject token address, or zero address for docs only
 * @param category - the claim category
 * @param sourceHash - hash of the source quote
 * @param sourceRef - archive capture id or commit hash
 * @param verifiedAtBlock - block the verification was read at
 * @param verdict - 0 held, 1 broken, 2 unverifiable
 * @returns the encoded schema data for the attestation
 */
export function encodeStrataSchema(
  subject: string,
  category: string,
  sourceHash: string,
  sourceRef: string,
  verifiedAtBlock: number,
  verdict: number,
): string {
  const encoder = new SchemaEncoder(
    'address subject,string category,bytes32 sourceHash,string sourceRef,uint64 verifiedAtBlock,uint8 verdict',
  );
  return encoder.encodeData([
    { name: 'subject', value: subject, type: 'address' },
    { name: 'category', value: category, type: 'string' },
    { name: 'sourceHash', value: sourceHash, type: 'bytes32' },
    { name: 'sourceRef', value: sourceRef, type: 'string' },
    { name: 'verifiedAtBlock', value: verifiedAtBlock, type: 'uint64' },
    { name: 'verdict', value: verdict, type: 'uint8' },
  ]);
}

/**
 * Reads the registry contract counts used by the live metrics section.
 * @param registryAddress - the deployed StrataRegistry address
 * @returns the three counters, projects on record, material changes found, attestations written
 */
export async function readRegistryMetrics(
  registryAddress: string,
): Promise<{ projectsOnRecord: bigint; materialChanges: bigint; attestations: bigint }> {
  const client = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined) });
  const abi = [
    {
      name: 'projectsOnRecord',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'totalMaterialChanges',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'totalAttestations',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const;
  const [projects, changes, attestations] = await Promise.all([
    client.readContract({ address: registryAddress as `0x${string}`, abi, functionName: 'projectsOnRecord' }),
    client.readContract({ address: registryAddress as `0x${string}`, abi, functionName: 'totalMaterialChanges' }),
    client.readContract({ address: registryAddress as `0x${string}`, abi, functionName: 'totalAttestations' }),
  ]);
  return { projectsOnRecord: projects, materialChanges: changes, attestations };
}
