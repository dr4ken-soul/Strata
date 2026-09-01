# APP_BLUEPRINT.md — Strata

## Product Summary

Strata is a promise ledger for projects on Base, it reconstructs every published version of a project's website and documentation, diffs those versions in order, classifies each change as cosmetic or material, extracts the claim inside every material change as a structured record, checks every claim that has an onchain equivalent against Base, and writes each verified or broken promise as an attestation so the record survives the page being edited or deleted

Built for the Orion Builder Hackathon, submissions close 2 September 2026 at 23:59 UTC, judged on usefulness, execution and originality with an AI vetting score and community upvotes feeding the panel

The axis Strata occupies is time, every other research tool in that gallery photographs the present, Strata holds a project's own history against it

---

## Market Context

**Who this is for**

1. Launchpad and exchange listing desks, the six judges include four operators from HuoStarter, Up10, WEEX and BingX, and the first question a desk asks about a project is whether the terms it is being shown today are the terms it published six months ago, that question currently has no tool
2. Treasury and index committees, who inherit a project's self reported supply and allocation figures with no reconciliation step
3. Retail holders and community moderators, who discover a shortened cliff or a moved allocation after the unlock rather than before it
4. Researchers and journalists, who need a citable, timestamped record rather than a screenshot

**What they use now**

Manual archive checks one page at a time, screenshots pasted into group chats, and memory, there is no product that treats a project's published claims as a versioned dataset and reconciles it against chain state

**Why they switch**

Because the alternative is not another tool, the alternative is nobody kept the old copy

---

## MVP Feature Set

### Feature 1, version reconstruction

**User story**, as a listing analyst I want every published version of a project's docs and site assembled in order so that I can see what the project used to say without hunting an archive by hand

**How it works**, two sources run in parallel, the archive path queries the Wayback CDX index for every capture of the target host and its docs path, hashes the extracted text of each page section, and fetches the full capture only where a section hash differs from the previous capture, the repository path resolves the project's public docs repository where one exists, GitBook, Docusaurus and Mintlify all sync to git, and walks the commit history of the docs directory so each change carries a commit hash, an author and a timestamp, force pushes and deleted branches are recorded as gaps rather than silently smoothed over

**Acceptance criteria**, running the reconstruction against Aerodrome returns an ordered capture set covering the project's public history with a stated coverage percentage, and re running it produces the identical set, the section hashing means a second run fetches almost nothing

**Complexity**, medium

---

### Feature 2, deterministic diff and material classification

**User story**, as an analyst I want the noise stripped out so that I only read the changes that actually alter what the project promised

**How it works**, the diff engine compares consecutive captures pairwise and produces a change set in code, no model is involved in producing the change set, the model then reads one diff at a time and performs exactly one task, mark the change cosmetic or material and, if material, extract the claim as a structured record with a category, a value, a unit and a source reference, the model never decides whether a claim is true and never outputs a number that is not present in the text it was given

**Acceptance criteria**, a whitespace, navigation or wording change is classified cosmetic and does not appear on the ledger, a change to a supply figure, an allocation percentage, a cliff length, an unlock rate, a lock claim, an audit claim, a burn claim, a fee or an ownership claim is classified material and produces a claim record carrying its exact source quote, its capture timestamp and its commit hash or archive capture id, the Seamless rewrite is classified as a rewrite with its claims extracted individually rather than as a single fraud signal

**Complexity**, high

---

### Feature 3, onchain verification against Base

**User story**, as an analyst I want the published claim checked against the chain so that the ledger tells me what is true now, not only what was said then

**How it works**, each claim category maps to a fixed verification routine executed in code against Base, total and circulating supply against the token contract, team and treasury allocation against the live holder set with labelled categories, lock claims against the locker contract holding the position, burn claims against the balance at the burn address, ownership and mint authority against the contract itself, audit claims against the auditor's own published register, every result records the contract address, the method called, the returned value and the block number at which it was read

**Acceptance criteria**, every verified row on a ledger can be reproduced by a third party from the contract address, the method and the block number printed on that row, and a claim with no onchain equivalent is recorded as unverifiable with a reason rather than scored

**Complexity**, high

---

### Feature 4, attestation on Base

**User story**, as a community member I want the finding to outlive the project's ability to delete the evidence

**How it works**, each verified or broken promise is written as an attestation through the Ethereum Attestation Service on Base under a Strata schema, the attestation carries the subject token address, the claim category, a hash of the source quote, the source reference, the verification block and the verdict, the full source text and the capture body live off chain and are addressed by that hash, so the attestation stays cheap while remaining tamper evident

**Acceptance criteria**, an attestation resolves on Basescan, its source hash matches the stored capture, and the ledger renders correctly from attestations alone when the off chain store is unavailable

**Complexity**, medium

---

### Feature 5, the ledger view

**User story**, as anyone reading this I want to see the whole history of one claim on one line so that a revision is obvious at a glance

**How it works**, the ledger renders one row per claim category and one marker per published version of that claim, positioned on a real time axis, a connector between two markers renders dashed and labelled where the claim changed, and every marker opens the exact published quote beside the exact chain reading

**Acceptance criteria**, the Degen ledger shows at least one revised connector, the Aerodrome and Moonwell ledgers render clean, and every marker is reachable and readable by keyboard

**Complexity**, medium

**The feature that decides the judging**, a project's own words, timestamped, placed against the chain, on an axis, verifiable by anyone from the references printed on the row

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 App Router, TypeScript | Server rendering for the public ledger pages, which need to be linkable and indexable, and clean wagmi provider composition, per CRYPTO_SKILL.md Category A |
| Styling | Tailwind CSS | Matches FRONTEND_SPEC.md class for class |
| Animation | motion/react | Correct import path for v11 and above, used for every entrance and the ledger marker stagger |
| Wallet | wagmi + viem | Standard for EVM, and viem is what the attestation client expects |
| Ingest and engine | Python 3.11, FastAPI, async | The diff, hashing and archive work is data heavy and Python has the better tooling for it, per CRYPTO_SKILL.md Category B |
| Archive source | Wayback CDX API plus capture fetch | The only complete public record of prior versions |
| Repository source | GitHub REST plus git history of the docs path | Gives exact commit hashes and authors where the project publishes docs from a repository |
| Diff | Structural HTML to text extraction, then a token level diff per section | Section hashing first so the crawl stays small |
| Model | Claude API, one diff per call, structured output only | Classification and claim extraction only, never arithmetic and never verification |
| Chain reads | viem public client against Base mainnet, no third party index | Every number on a ledger must be reproducible from a contract call |
| Attestations | Ethereum Attestation Service on Base | Existing, audited, no custom registry needed for the record itself |
| Registry contract | Solidity 0.8.24, Foundry | A thin registry only, for ledger ownership and counts |
| Storage | Supabase Postgres for captures, claims and runs, plus object storage for capture bodies | Off chain store mirrors chain state, never the reverse |
| Cache | Redis for CDX responses and repeat chain reads inside a run | Keeps a re run cheap |
| Hosting | Vercel for the frontend, Fly for the engine | Standard, and the engine needs a long running worker Vercel functions cannot hold |

Write order rule, the chain write happens first and the database row records the confirmed attestation uid, no off chain record ever claims an attestation that has not confirmed

---

## Engine Detail

### Capture ingestion

```python
async def ingestCaptures(host: str, docsPath: str | None) -> list[Capture]:
    """
    Assembles every distinct published version of a target's pages
    Queries the Wayback CDX index, hashes the extracted text of each page
    section, and fetches a full capture body only where a section hash differs
    from the previous capture, which keeps a re run close to free
    @param host - the project's primary host, without scheme
    @param docsPath - optional docs subpath or docs subdomain
    @returns ordered captures, oldest first, each carrying a coverage flag
    """
```

Coverage is computed as the share of thirty day windows inside the project's public lifetime that contain at least one capture, and it is printed on the ledger, a project below fifty percent coverage returns a partial ledger and says so at the top rather than presenting an incomplete history as a complete one

### Diff and classification

```python
def buildChangeSet(previous: Capture, current: Capture) -> list[Change]:
    """
    Produces the change set between two captures in code, with no model involved
    Sections are matched by heading path, then compared at token level, a change
    is emitted per section with its before text, its after text and its position
    """
```

```python
async def classifyChange(change: Change) -> ClaimRecord | CosmeticMark:
    """
    Sends one change to the model and returns a structured record
    The model marks the change cosmetic or material and, when material, extracts
    the claim category, the value exactly as written, the unit and the quote
    The model is given no chain data, performs no arithmetic, and any response
    containing a figure absent from the input text is rejected and retried once
    before the change is marked unresolved rather than guessed
    """
```

### Verification

```python
async def verifyClaim(claim: ClaimRecord, token: str) -> Verification:
    """
    Executes the fixed routine for the claim's category against Base
    Records the contract address, the method, the returned value and the block
    Returns a verdict of held, broken or unverifiable, with a reason on
    unverifiable, never a score and never an estimate
    """
```

Verification routines by category

| Category | Checked against |
|---|---|
| Supply | `totalSupply` on the token contract, and circulating derived from the labelled holder set |
| Allocation | Live balances of the labelled team, treasury and locker addresses over total supply |
| Unlocks | The locker or vesting contract's own schedule state |
| Locks | Balance and unlock timestamp held by the locker contract |
| Burns | Balance at the burn address |
| Ownership | `owner`, `getRoleMember` and mint authority on the contract |
| Audit | The named auditor's published register, matched on the exact contract address |
| Fees | The fee parameter read from the contract, where the contract exposes one |

### Attestation

```solidity
/// @notice Writes one verified or broken promise to Base through EAS
/// @param subject the token or project contract the promise concerns
/// @param category the claim category, as a bytes32 enum
/// @param sourceHash keccak256 of the exact published quote
/// @param sourceRef archive capture id or commit hash, as a string
/// @param verifiedAtBlock the block at which the chain reading was taken
/// @param verdict 0 held, 1 broken, 2 unverifiable
function attestPromise(
    address subject,
    bytes32 category,
    bytes32 sourceHash,
    string calldata sourceRef,
    uint64 verifiedAtBlock,
    uint8 verdict
) external returns (bytes32 uid);
```

---

## Data Structures

```typescript
type ClaimCategory =
  | 'supply' | 'allocation' | 'unlocks' | 'locks'
  | 'audit' | 'ownership' | 'fees' | 'burns'

type Verdict = 'held' | 'broken' | 'unverifiable'

interface Capture {
  captureId: string
  source: 'archive' | 'repository'
  sourceRef: string          // wayback capture id or commit hash
  capturedAt: number         // unix seconds
  url: string
  sectionHashes: Record<string, string>
  bodyKey: string            // object storage key for the full body
}

interface ClaimRecord {
  claimId: string
  category: ClaimCategory
  valueAsWritten: string
  unit: string | null
  quote: string
  captureId: string
  capturedAt: number
  supersedes: string | null  // previous claimId in the same category
}

interface Verification {
  claimId: string
  contract: `0x${string}`
  method: string
  returnedValue: string
  blockNumber: bigint
  verdict: Verdict
  reason: string | null      // required when verdict is unverifiable
  attestationUid: `0x${string}` | null
}

interface LedgerRun {
  slug: string
  subject: `0x${string}` | null
  host: string
  windowStart: number
  windowEnd: number
  coveragePercent: number
  captureCount: number
  materialChangeCount: number
  brokenCount: number
  lastBlock: bigint
  status: 'queued' | 'ingesting' | 'diffing' | 'classifying' | 'verifying' | 'complete' | 'partial' | 'failed'
}
```

---

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ledger` | wallet signature | Queues a run for a token address or a docs URL |
| GET | `/api/ledger/{slug}` | public | Returns the full ledger, claims, verifications and coverage |
| GET | `/api/ledger/{slug}/stream` | public | Server sent events, emits stage progress and counts while a run executes |
| GET | `/api/claims/{claimId}` | public | Returns one claim with its quote, source reference and verification |
| GET | `/api/fixtures` | public | Returns the five stored fixture runs that back the landing page |
| GET | `/api/metrics` | public | Returns the three live counters, read from the registry contract |

Rate limits, one queued run per wallet per five minutes, sixty public reads per minute per address, the stream endpoint is capped at one open connection per client

---

## Environment Variables

```
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_STRATA_REGISTRY_ADDRESS=
NEXT_PUBLIC_EAS_ADDRESS=
NEXT_PUBLIC_EAS_SCHEMA_UID=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ENGINE_URL=

ENGINE_RPC_URL=
ENGINE_PRIVATE_KEY=
ANTHROPIC_API_KEY=
GITHUB_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
REDIS_URL=
```

`ENGINE_PRIVATE_KEY` belongs to a dedicated hot wallet used only to submit attestations, it holds no user funds, it never appears in the frontend and it never reaches the browser, resolve the EAS contract address and schema uid from the official EAS deployment records for Base at build time rather than hardcoding either from memory

---

## App Routes

- `/` the FRONTEND_SPEC.md landing page, public, no wallet
- `/ledger/[slug]` a public read only ledger, linkable and server rendered, no wallet
- `/app` wallet gated index of the connected wallet's runs
- `/app/ledger/[slug]` the same ledger with the attest control attached
- `/app/new` the run form, with the five stage live progress checklist

---

## Fixtures, the proof the engine works

These five are named in the repository, seeded as stored runs, and shown on the landing page, each one exists to prove a different property

| Fixture | Role | What it proves |
|---|---|---|
| Aerodrome Finance | Control | A well run project with a long docs history returns a clean ledger, the tool is an instrument and not an accusation machine |
| Moonwell | Control | Announced changes reconcile against a public governance record, so a change that was announced is not reported as a quiet edit |
| Degen | Schedule | Published emission and season plans that moved over time, reconciled against what the chain shows was actually minted |
| Seamless Protocol | Rewrite | Documentation substantially rewritten at the move off the Aave fork, the hardest classification case, it must come back as a rewrite with claims extracted individually rather than as a fraud signal |
| Friend.tech | Vanished | The site went and the promises went with it, which is the entire argument for the attestation layer, the ledger still holds what was published |

Every figure shown for these five on the landing page is read from its stored run, none is typed into the page

---

## What Is Not Being Built in This Version

- Any scoring or ranking of projects, Strata reports promises and verdicts, it never issues a grade, that restraint is deliberate and it is stated on the site
- Sentiment, social or team analysis of any kind
- Chains other than Base
- Automated monitoring with alerts on new edits, the run is triggered, not continuous, continuous watch is the first thing to build after
- Dispute or appeal flow for a project that contests a verdict, the source quote and the chain reference are published instead so a dispute can be settled by anyone reading
- A native token, a fee or a treasury
- A mobile application

---

## Hackathon Deliverables Checklist

- Registered wallet, done before anything else, submission must come from the pre registered address
- Website live at a public HTTPS URL
- Public GitHub repository with a complete README covering install, environment and a local run
- X profile live and linked
- Telegram or Discord link live
- Functional end to end with no mock data, every number on the site is a live read or a stored real run
- Deployed on Base with the registry contract verified and at least one attestation resolving on Basescan
- Ignition fee of roughly ten dollars in ETH budgeted and paid before the final hour, not in it
- Demo video recorded, the fifteen second core is the Degen ledger revealing a revised connector, the full video runs under three minutes
- Submitted before 2 September 2026, 23:59 UTC, late entries are not accepted

---

## Build Priority

1. Ingest and diff running against Aerodrome and Degen, producing a real change set on disk
2. Classification returning structured claim records, with the rejection path for any figure the model invents
3. Verification against Base for supply, allocation, locks and ownership, the four categories that cover most of what the fixtures contain
4. The ledger view rendering one real fixture end to end, this is the demo
5. Attestation writing and resolving on Basescan
6. The remaining three fixtures seeded
7. Landing page per FRONTEND_SPEC.md
8. README, X, Telegram, demo video, submission
