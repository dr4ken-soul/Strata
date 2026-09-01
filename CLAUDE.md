# CLAUDE.md — Strata

This file governs how code is written in this repository, read it fully before touching a file

---

## What Strata Is

A promise ledger for projects on Base, it reconstructs every published version of a project's site and docs, diffs those versions in order, classifies each change as cosmetic or material, extracts every material claim as a structured record, checks each claim that has an onchain equivalent against Base, and writes the result as an attestation so the finding outlives the page

The product argument is that projects rarely lie once, they revise, so hold the old copy against the chain

---

## Non Negotiables

1. **No mock data anywhere**, no placeholder figures, no lorem, no invented project names, no seeded fake attestation uids, every number rendered is a live read or a stored real run, an empty state is correct and a fabricated one is a failed build
2. **The model never computes and never verifies**, it classifies a diff and extracts a claim from text it was handed, all arithmetic, all chain reads and all verdicts happen in code, a model response containing a figure absent from its input is rejected, retried once, then marked unresolved
3. **Every rendered number carries its provenance**, a chain figure carries its contract address, method and block number, a published figure carries its quote, timestamp and capture id or commit hash, a figure that cannot carry provenance does not get rendered
4. **Chain first write order**, the attestation confirms before any database row records it, never the reverse
5. **Unverifiable is a first class outcome**, a claim with no onchain equivalent is recorded as a promise with no proof and a stated reason, it is never scored, never inferred and never quietly dropped
6. **Partial coverage is stated, not smoothed**, when the archive record is thin the ledger says partial coverage with the percentage at the top, an incomplete history is never presented as a complete one
7. **Strata reports, it does not grade**, no score, no rank, no letter, no risk number, anywhere in the product or the copy
8. **No hardcoded brand logos or symbols**, fixture rows are text and data, ask before adding any mark

---

## Code Conventions

- TypeScript strict, no `any`, no non null assertions, unknown then narrow
- Python 3.11 with full type hints, `mypy --strict` clean on the engine
- camelCase for TypeScript variables and functions, PascalCase for components and types, snake_case for Python, SCREAMING_SNAKE for constants and env keys
- Every exported function carries a JSDoc or docstring block stating what it does, its parameters and what it returns, this is enforced in review
- Async everywhere on the engine, no blocking IO inside a request handler
- Errors surface with the stage that failed and the target that failed, `ingest failed for docs.example.xyz at capture 20240211` and not `something went wrong`
- No `console.log` in committed code, use the structured logger
- One responsibility per module, the diff engine imports no model client and the model client performs no chain reads

---

## Directory Layout

```
strata/
  web/
    app/
      page.tsx                 landing, per FRONTEND_SPEC.md
      ledger/[slug]/page.tsx   public read only ledger
      app/                     wallet gated routes
      api/
    components/
      strata-field.tsx         the coded background column
      ledger/                  axis, row, marker, quote panel
      ui/
    lib/
      wagmi.ts  eas.ts  format.ts  fetcher.ts
    styles/
  engine/
    ingest/     cdx.py  repo.py  extract.py  hash.py
    diff/       sections.py  tokens.py  changeset.py
    classify/   client.py  schema.py  guard.py
    verify/     supply.py  allocation.py  locks.py  burns.py  ownership.py  audit.py  fees.py
    attest/     eas.py  queue.py
    api/        routes.py  stream.py
    fixtures/   aerodrome.yaml  moonwell.yaml  degen.yaml  seamless.yaml  friendtech.yaml
  contracts/
    src/StrataRegistry.sol
    test/StrataRegistry.t.sol
```

---

## Frontend Rules

Follow FRONTEND_SPEC.md exactly, it is the contract for the landing page, in particular

- Import motion from `motion/react`, never from `framer-motion`
- No emoji in any interface copy, no `text-3xl`, `text-4xl` or `text-5xl` on any heading, use the clamp scale defined in the spec
- No `bg-gradient-to-r` on text, no purple to pink anything, no glassmorphism, no arbitrary drop shadows outside the defined cool tinted set
- The Strata Field is coded SVG, it is never an image file and never a canvas particle system
- Wallet connection appears on `/app` routes only, the landing page has no connect button and no wallet state
- Every hash, timestamp, block number and figure renders in Martian Mono with tabular numerals
- Respect `prefers-reduced-motion`, entrances become instant and the field draws in immediately at final opacity
- Keyboard reachable ledger markers, visible focus rings, contrast at AA or better

---

## Contract Rules

- Solidity 0.8.24, Foundry, no unchecked arithmetic without a comment stating why it is safe
- The registry stores ledger ownership and counts only, the record itself lives in EAS attestations, do not build a parallel record onchain
- Checks effects interactions, no external call before state is written
- Named errors, no bare `require` strings
- Foundry tests must cover a held verdict, a broken verdict, an unverifiable verdict, a duplicate attestation attempt and an unauthorised caller, before deployment
- Verify the contract on Basescan immediately after deploy, an unverified contract is not shipped

---

## Fixtures

Aerodrome Finance and Moonwell are the clean controls, Degen carries a changed emission schedule, Seamless carries the architecture rewrite that must classify as a rewrite rather than a fraud signal, Friend.tech is the vanished site that proves why the attestation layer exists

These five are the regression suite, a change to the diff or classification path that alters any of their stored outputs must be explained in the pull request before it merges

---

## Before Any Commit

1. `tsc --noEmit` clean, `mypy --strict` clean on the engine
2. No mock data, no hardcoded figures, no placeholder addresses
3. Every rendered number traceable to a contract call or a stored capture
4. Reduced motion path checked
5. Mobile checked at 375, 768 and 1440
6. Fixture outputs unchanged, or the change explained
