export type ClaimCategory =
  | 'supply'
  | 'allocation'
  | 'unlocks'
  | 'locks'
  | 'audit'
  | 'ownership'
  | 'fees'
  | 'burns';

export type Verdict = 'held' | 'broken' | 'unverifiable';

export interface Capture {
  captureId: string;
  source: 'archive' | 'repository';
  sourceRef: string;
  capturedAt: number;
  url: string;
  sectionHashes: Record<string, string>;
  bodyKey: string;
}

export interface ClaimRecord {
  claimId: string;
  category: ClaimCategory;
  valueAsWritten: string;
  unit: string | null;
  quote: string;
  captureId: string;
  capturedAt: number;
  supersedes: string | null;
}

export interface Verification {
  claimId: string;
  contract: `0x${string}` | null;
  method: string;
  returnedValue: string;
  blockNumber: string;
  verdict: Verdict;
  reason: string | null;
  attestationUid: `0x${string}` | null;
}

export interface LedgerRun {
  slug: string;
  subject: string | null;
  host: string;
  name: string;
  role: string;
  why: string;
  windowStart: number;
  windowEnd: number;
  coveragePercent: number;
  captureCount: number;
  materialChangeCount: number;
  brokenCount: number;
  lastBlock: string;
  status: 'queued' | 'ingesting' | 'diffing' | 'classifying' | 'verifying' | 'complete' | 'partial' | 'failed';
  claims: ClaimRecord[];
  verifications: Verification[];
}

export interface FixtureSummary {
  slug: string;
  name: string;
  role: string;
  why: string;
  captureCount: number;
  materialChangeCount: number;
  brokenCount: number;
  status: LedgerRun['status'];
}

export interface IngestEvent {
  project: string;
  slug: string;
  materialChangeCount: number;
  blockNumber: string;
  at: number;
}
