# Strata

A promise ledger for projects on Base. Strata reconstructs every published version of a project's website and documentation, diffs those versions in order, classifies each change as cosmetic or material, extracts the claim inside every material change as a structured record, checks every claim that has an onchain equivalent against Base, and writes each verified or broken promise as an attestation through the Ethereum Attestation Service so the record survives the page being edited or deleted.

Projects rarely lie once, they revise. Strata holds the old copy against the chain.

Built for the Orion Builder Hackathon.

## Repository layout

```
strata/
  web/        Next.js 14 App Router frontend (TypeScript, Tailwind, wagmi, viem, motion)
  engine/     Python 3.11 FastAPI engine (ingest, diff, classify, verify, attest, api)
  contracts/  Foundry project: StrataRegistry.sol plus tests
```

## Prerequisites

- Node 20 or newer
- Python 3.11 or newer
- Foundry (forge) for the contracts, https://book.getfoundry.sh

## Environment

Copy the examples and fill in the values:

```
cp web/.env.example web/.env.local
cp engine/.env.example engine/.env
```

Full variable list is in APP_BLUEPRINT.md. `ENGINE_PRIVATE_KEY` belongs to a dedicated hot wallet used only to submit attestations, it holds no user funds and it never reaches the browser.

## Running the frontend

```
cd web
npm install
npm run dev
```

Open http://localhost:3000. The landing page and `/ledger/[slug]` are public and server rendered, `/app` routes are wallet gated.

## Running the engine

```
cd engine
python -m venv .venv
.venv\Scripts\activate        # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn engine.api.app:app --port 8000
```

Set `NEXT_PUBLIC_ENGINE_URL=http://localhost:8000` in `web/.env.local` so the frontend proxies runs to it.

A single ingest against a fixture host:

```
python -m engine.ingest aerodrome.finance
```

## Contracts

```
cd contracts
forge install
forge test
forge build
```

Deploy to Base mainnet with `forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast`, then verify on Basescan in the same minute. The registry stores ledger ownership and counts only, the record itself lives in EAS attestations.

## Architecture

1. **Ingest** (deterministic), Wayback CDX index plus the project's public docs repository history, each page section hashed by heading path so a re run fetches almost nothing, coverage computed as the share of thirty day windows holding at least one capture.
2. **Diff** (deterministic), sections matched by heading path and compared at token level, one change per section, byte identical output on identical inputs.
3. **Classify** (model), one diff per model call, structured output only, any returned figure absent from the input text is rejected, retried once, then the change is marked unresolved, never guessed.
4. **Verify** (deterministic), fixed routines per claim category against Base, every result records the contract address, the method, the returned value and the block number.
5. **Attest** (onchain), each verified or broken promise written as an EAS attestation on Base, chain write confirms first, then the database records the uid.

## Non negotiables

- No mock data anywhere, an empty state is correct and a fabricated one is a failed build
- The model never computes and never verifies
- Every rendered number carries its provenance
- Unverifiable is a first class outcome, stated with a reason, never scored
- Partial coverage is stated, not smoothed
- Strata reports promises and verdicts, it never issues a grade

## Fixtures

| Fixture | Role |
|---|---|
| Aerodrome Finance | Control, expected clean |
| Moonwell | Control, announced changes reconcile |
| Degen | Schedule, emission plans that moved |
| Seamless Protocol | Rewrite, the hardest classification case |
| Friend.tech | Vanished site, why the attestation layer exists |

## License

MIT
