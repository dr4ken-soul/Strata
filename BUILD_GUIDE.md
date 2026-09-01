# BUILD_GUIDE.md — Strata

The order to build in, what each phase must prove before the next one starts, and the checks that stop a broken thing from moving forward

Build in this order even if a later phase looks more fun, every phase depends on the one above it producing real output, and the whole product rests on the engine actually working rather than appearing to

---

## Phase 0, ground

Register the submission wallet first, before any code, the submission must come from the pre registered address and this is the one step that cannot be recovered late

Then

```
mkdir strata && cd strata
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir
cd web && npm i wagmi viem @tanstack/react-query motion @ethereum-attestation-service/eas-sdk
cd .. && mkdir engine && cd engine
python3.11 -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn httpx pydantic redis supabase web3 anthropic beautifulsoup4 lxml
cd .. && forge init contracts --no-git
```

Create `.env.local` and `.env` from the variable list in APP_BLUEPRINT.md, put both in `.gitignore` before the first commit, a leaked engine key is a dead submission

**Checkpoint**, wallet registered, three sub projects install and run clean, nothing secret is tracked

---

## Phase 1, ingest

Build `engine/ingest` against Aerodrome first because its docs history is long and clean

Query the Wayback CDX index for the host and the docs path, take the capture list, extract text per section by heading path, hash each section, and fetch a full capture body only where a section hash differs from the previous capture, store bodies in object storage keyed by capture id and store the hash map in Postgres

Add the repository path second, resolve the docs repository where the project publishes from one, walk the commit history of the docs directory, and record force pushes and missing ranges as gaps

Compute coverage as the share of thirty day windows in the project's public lifetime holding at least one capture, store it on the run

**Checkpoint**, `python -m engine.ingest aerodrome.finance` writes an ordered capture set to the database, a second run fetches almost nothing, and coverage prints a real percentage, do not proceed on a partial ingest that silently drops ranges

---

## Phase 2, diff

Build `engine/diff` with no model client imported into the package, sections match by heading path, then compare at token level, emit one change per section carrying before text, after text and position

Run it across the full Aerodrome capture set and read the output by hand, most changes should be trivial, that is expected and it is exactly what the next phase removes

**Checkpoint**, a change set exists on disk for two fixtures, and running the diff twice on the same inputs produces byte identical output, determinism here is what makes every later verdict reproducible

---

## Phase 3, classify

One change per model call, structured output only, the model returns cosmetic or material and, when material, a claim record with category, value exactly as written, unit and quote

Build the guard before the client is wired to anything, any returned figure that does not appear in the input text fails the response, retry once, then mark the change unresolved, an unresolved change is visible in the run and is never guessed at

**Checkpoint**, Aerodrome and Moonwell return mostly cosmetic with a small material set, Degen returns at least one material change on emissions, Seamless classifies as a rewrite with claims extracted individually and not as one blanket flag, if Seamless comes back as a single fraud signal the classifier is wrong and must be fixed here, not later

---

## Phase 4, verify

Build the routines in this order, supply, allocation, locks, ownership, then burns, fees and audit, each one records the contract address, the method, the returned value and the block number

A claim with no onchain equivalent returns unverifiable with a written reason, never a score and never an estimate

**Checkpoint**, pick three verified rows at random and reproduce each one by hand from the contract address, method and block printed on it, if any row cannot be reproduced the row does not ship

---

## Phase 5, the ledger view

This is the demo, build it before the landing page

One row per claim category, one marker per published version, positioned on a real time axis, a dashed labelled connector where a claim changed, every marker opens the published quote beside the chain reading

Server render `/ledger/[slug]` so the page is linkable and indexable, no wallet anywhere on it

**Checkpoint**, the Degen ledger loads from real stored data and shows a revised connector, every marker is reachable and readable by keyboard, and the page renders correctly with JavaScript disabled down to static content

---

## Phase 6, attestation

Deploy `StrataRegistry` to Base and verify it on Basescan the same minute, resolve the EAS contract address and schema uid from the official EAS deployment records for Base rather than from memory, register the Strata schema, then write attestations from the engine hot wallet

Chain write confirms first, then the database records the uid

**Checkpoint**, an attestation resolves on Basescan, its source hash matches the stored capture, and the ledger still renders correctly with the off chain store switched off

---

## Phase 7, the remaining fixtures

Seed Moonwell, Seamless and Friend.tech as stored runs, Friend.tech will show thin late coverage and that is the point, the ledger holds what was published after the site went

Freeze all five outputs as the regression suite, any later change to diff or classification that moves them must be explained before it merges

**Checkpoint**, five stored runs served from `/api/fixtures`, and every figure the landing page will show is readable from that endpoint rather than typed into the page

---

## Phase 8, the landing page

Build from FRONTEND_SPEC.md section by section in its stated order, masthead, hero, problem, mechanism, the Ledger, fixtures, coverage and limits, live metrics, final CTA, footer

Build the Strata Field first as coded inline SVG with the fixed seed, then the sections on top of it, the field is the spine of the page and retrofitting it is worse than starting with it

**Checkpoint**, run the spec's own audit list, no banned typography scale, no gradient text, no emoji, motion imported from `motion/react`, reduced motion honoured, contrast AA or better, and the three live counters reading from the registry rather than from constants

---

## Phase 9, submission

README covering install, environment and a local run against one fixture, X profile live, Telegram or Discord live, website deployed on HTTPS, repository public

Pay the ignition fee well before the final hour, not in it

Record the demo video, open on the Degen ledger revealing a revised connector inside the first fifteen seconds, then the quote beside the chain reading, then the attestation on Basescan, keep the whole thing under three minutes

Submit from the pre registered wallet before 2 September 2026, 23:59 UTC

**Final checkpoint**, walk the product as a stranger, connect a fresh wallet, queue a run on a project not in the fixture set, and watch it complete, if a cold path breaks in front of you it will break in front of a judge

---

## Rules That Apply in Every Phase

No mock data at any point, an empty state is correct and a fabricated one is a failed build

Every number carries provenance or it does not render

The model classifies and extracts, code computes and verifies, that line is never crossed

Unverifiable and partial coverage are stated plainly, they are results, not failures to hide

Strata reports promises and verdicts, it never issues a grade
