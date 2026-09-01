# FRONTEND_SPEC.md — Strata

A promise ledger for Base, Strata reconstructs every published version of a project's site and docs, diffs them in order, and checks every material claim that survived against the chain, built for the Orion Builder Hackathon

---

## 0. Project Identity

- **Name:** Strata
- **One line pitch:** Projects rarely lie once, they revise, Strata keeps every old copy, diffs it, and holds what is left against Base
- **Aesthetic (Gate 1):** Archival editorial light
- **Identity fingerprint (§0C):** asymmetric editorial / editorial serif with rational sans and mono / pristine cool paper with a single ink red pop / archival ruled grid with micro noise / editorial stagger / editorial reveal
- **Dials:** DESIGN_VARIANCE 6, MOTION_INTENSITY 5, VISUAL_DENSITY 7
- **Colour strategy:** Restrained, tinted neutrals with one accent held under ten percent of surface
- **Category:** A, on chain product, wallet signature required to commit a ledger attestation, reading a ledger requires no wallet
- **Chain:** Base mainnet, attestations written through EAS
- **Logo and favicon:** neither exists, both stay as plain comment slots, never an emoji, never a generated mark

---

## 1. Global Design System

### 1.1 Fonts (Gate 4, confirmed)

```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500;6..72,600;6..72,700&family=Archivo:wght@300;400;500;600;700&family=Martian+Mono:wght@300;400;500;600&display=swap');
```

- `--font-display`: 'Newsreader', serif, headlines and ledger verdicts only
- `--font-body`: 'Archivo', sans-serif, subheads, descriptions, body copy
- `--font-mono`: 'Martian Mono', monospace, hashes, timestamps, block numbers, addresses, every figure in a diff column

Three families, no fourth, `font-variant-numeric: tabular-nums` is set globally on `--font-mono` so diff columns align

### 1.2 Colour System (Gate 5, confirmed)

```css
:root {
  --bg-primary:     #eff1f0;
  --bg-secondary:   #e5e8e6;
  --bg-surface:     #fbfcfb;
  --bg-elevated:    #ffffff;

  --ink-primary:    #101418;
  --text-secondary: #4e565c;
  --text-muted:     #8b949a;

  --rule:           rgba(16, 20, 24, 0.12);
  --rule-strong:    rgba(16, 20, 24, 0.24);

  --accent:         #a8322b;
  --accent-hover:   #c2453c;
  --accent-wash:    rgba(168, 50, 43, 0.08);

  --verified:       #2f6b4f;
  --verified-wash:  rgba(47, 107, 79, 0.08);
  --unverifiable:   #9a6b1f;
  --unverifiable-wash: rgba(154, 107, 31, 0.08);

  --radius-sm: 2px;  --radius-md: 4px;  --radius-lg: 8px;

  --shadow-sm: 0 2px 6px -2px rgba(16, 20, 24, 0.05);
  --shadow-md: 0 12px 24px -12px rgba(16, 20, 24, 0.06);
  --shadow-lg: 0 20px 40px -15px rgba(16, 20, 24, 0.06);

  --duration-fast: 140ms; --duration-normal: 260ms; --duration-slow: 520ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

`--bg-elevated` is used at full opacity only on a lifted card, never as a page surface, no pure black text and no pure white surface anywhere else

Ink red carries one meaning only, a promise that was broken or a primary action, it never decorates, and every state is carried by an inline SVG glyph and a text label as well as colour, so nothing depends on colour alone

### 1.3 Semantic Z Index Scale

```css
:root {
  --z-field:      0;   /* Strata Field, the fixed coded canvas */
  --z-grain:      3;   /* micro noise overlay, pointer-events-none */
  --z-content:    10;  /* every section container, relative */
  --z-lifted:     20;  /* floating cards inside a section */
  --z-sticky:     200; /* masthead strip */
  --z-dropdown:   300; /* wallet menu panel */
  --z-backdrop:   400; /* modal scrim */
  --z-modal:      500; /* wallet connect modal */
  --z-toast:      600; /* disconnect toast */
}
```

No arbitrary values, no 999, every new component takes a named slot

### 1.4 The Strata Field (bespoke, no COMPOSITION_RECIPES.md match)

No image and no video, this is a coded inline SVG stratigraphic column mounted once at the app root and shared across the whole page as the Unified Sticky Canvas confirmed at Gate 3, each band is one captured snapshot in time, oldest at the bottom

```
Container: fixed inset-0 z-0 pointer-events-none select-none
Element:   <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
             class="w-full h-full" aria-hidden="true" focusable="false">

Band generation:
  Count: 34 bands at md and above, 18 bands below md
    (read once on mount via window.matchMedia('(min-width: 768px)'), and on
     a debounced resize at 200ms, never on every resize event)
  Band i, index 0 at the bottom:
    y = 900 - (i * (900 / count)) + jitter
    jitter = seededNoise(i) * 3, range -3 to 3, seed fixed at 20260902 so the
      field is identical on every load and never re-randomises between routes
  Path: <path d={`M0 ${y} H1440`} />
  Stroke: var(--rule)
  Stroke width: 1, except every 6th band which is 1.75 and uses var(--rule-strong)
  Stroke linecap: butt
  vector-effect: non-scaling-stroke

Draw in on mount:
  stroke-dasharray: 1440
  stroke-dashoffset: 1440 -> 0
  transition: stroke-dashoffset 1.2s var(--ease-out)
  Stagger: transitionDelay = (i * 30)ms, applied inline
  Runs once per session on first mount, not per route change, the field persists

Active band (driven by section):
  A shared React context, sectionIndex, written by an IntersectionObserver on
    every <section data-band="n" data-density="hero|sparse|dense">
  The band whose index equals sectionIndex takes:
    stroke: var(--accent)
    stroke-width: 2
    transition: stroke 400ms var(--ease-out), stroke-width 400ms var(--ease-out)
  Tick marker on the active band only:
    <rect x="1392" y={y - 3} width="6" height="6" fill="var(--accent)" />
    Animation: opacity 0 -> 1 over 240ms, x 1400 -> 1392 over 240ms, ease var(--ease-out)
  Only ever one active band, the previous band transitions back to var(--rule)

Field opacity by density (the whole <svg> element):
  hero and final-cta sections in view      -> target 0.34
  sparse sections in view                  -> target 0.22
  dense sections in view                   -> target 0.10
  Lerp toward target at 0.04 per frame inside a requestAnimationFrame loop,
    never a snap, loop cancelled on unmount with cancelAnimationFrame

Reduced motion (prefers-reduced-motion: reduce):
  No draw in, no lerp, no tick animation
  Bands render complete at a flat opacity 0.16
  The active band still changes colour, with transition set to none
```

### 1.5 Micro Noise Overlay

```
Position: fixed inset-0 z-[3] pointer-events-none
Opacity: 0.035
backgroundImage: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
backgroundSize: 128px 128px
```

This is the only texture on the page, it is earned here because the surface is a document

### 1.6 Motion Primitives

Standard entrance, used by every section unless a recipe below overrides it:

```
initial:    { filter: 'blur(8px)', opacity: 0, y: 18 }
whileInView:{ filter: 'blur(0px)', opacity: 1, y: 0 }
transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
viewport:   { once: false, amount: 0.1 }
```

`viewport={{ once: true }}` is banned outright, every scroll animation on this page replays each time the element enters the viewport, scrolling down and scrolling back up, and `useInView` where used takes `{ once: false, amount: 0.1 }`

Stagger increment for grouped children, `delay: index * 0.1`, base delay 0.15

Rule reveal, used on every hairline divider, `scaleX 0 -> 1`, `transform-origin: left`, duration 0.8s, ease `[0.16, 1, 0.3, 1]`, this replaces a plain fade wherever a horizontal rule enters

### 1.7 Global CSS

```css
html { scrollbar-width: none; scroll-behavior: smooth; }
html::-webkit-scrollbar { display: none; }
body {
  background: var(--bg-primary);
  color: var(--ink-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; max-width: 72ch; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Icons come from inline SVG only, hand written path data, no icon library, no emoji anywhere in the interface

---

## 2. Navigation — Gate 2, C1 Editorial Masthead Strip

```
MASTHEAD (fixed, full width):
  Position: fixed top-0 inset-x-0 z-[200]
  Shell: h-11 md:h-12 flex items-center justify-between
         px-4 md:px-8 bg-[var(--bg-primary)]/88 backdrop-blur-md
         border-b border-[var(--rule)]
  Note: backdrop-blur is permitted here because the element is fixed, it is
        never applied to anything inside a scrolling container

  LEFT, issue line:
    Wordmark: font-mono text-[11px] md:text-xs uppercase tracking-[0.32em]
              text-[var(--ink-primary)]
      Text: "STRATA"
    Divider: mx-3 md:mx-4 h-3 w-px bg-[var(--rule-strong)]
    Issue data: font-mono text-[10px] md:text-[11px] tracking-[0.12em]
                text-[var(--text-muted)] hidden sm:block
      Format: "SNAPSHOTS {liveCount} · LAST INGEST {relativeTime}"
      Both values are live contract and API reads, never hardcoded
      Loading state: skeleton bar w-28 h-2.5 rounded-[2px] bg-[var(--rule)]
                     with shimmer, never a spinner

  CENTRE, ticker (hidden below md):
    Container: hidden md:flex flex-1 mx-8 overflow-hidden relative
      Edge masks: absolute inset-y-0 left-0 w-16 bg-gradient-to-r
                  from-[var(--bg-primary)] to-transparent z-10, mirrored right
    Track: flex w-max gap-10 animate-[masthead-ticker_48s_linear_infinite]
      hover: animation-play-state paused
      Each item: font-mono text-[10px] uppercase tracking-[0.18em]
                 text-[var(--text-secondary)] whitespace-nowrap
      Content: the five most recent ingest events, real records, format
        "{project} · {materialChangeCount} MATERIAL CHANGES · BLOCK {blockNumber}"
      Keyframes: from { transform: translateX(0) } to { transform: translateX(-50%) }
        with the item list duplicated once for a seamless loop
    This is the only marquee on the page

  RIGHT, single action:
    Link: font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em]
          text-[var(--ink-primary)] hover:text-[var(--accent)]
          transition-colors duration-[140ms]
      Label: "RUN A LEDGER"
      Behaviour: connect gated, see §2.1 entry point rules, it is a <button>
                 and never an anchor

WALLET PILL (fixed, always visible, outside the masthead):
  Position: fixed top-[52px] right-4 md:top-[60px] md:right-8 z-[200]
  Disconnected:
    bg-[var(--bg-surface)] border border-[var(--rule-strong)] rounded-full
    px-4 py-2 md:px-5 md:py-2.5 font-mono text-[11px] md:text-xs uppercase
    tracking-[0.14em] text-[var(--ink-primary)]
    hover:border-[var(--accent)] hover:text-[var(--accent)]
    transition-colors duration-[140ms]
    Label: "CONNECT WALLET"
  Connected: see §2.1, becomes the trigger for the wallet menu
```

Mobile, below md the ticker is removed entirely rather than shrunk, the issue line keeps the snapshot count only, and the action link stays

---

## 2.1 Wallet Gated Routing and App Interior Wallet Menu (Mandatory)

```
CONNECTION FLOW:
  Every Connect Wallet entry point on the landing page (masthead action, hero
    primary CTA, final CTA) calls one shared openModal handler, none of them
    calls wagmi connect directly
  WalletConnectModal owns connecting, pending, success and retryable error state
  Connecting state blocks the modal close control so the user cannot dismiss
    mid approval
  A newly connected wallet navigates to /app after the provider confirms success
  Initial persisted hydration never forces a redirect and never flashes the
    landing page

APP ROUTE GATE:
  /app and every nested route render only while isConnected is true
  While isReconnecting or isConnecting, render the branded skeleton screen,
    keep the requested URL, never redirect and never replace the URL
  Confirmed disconnection navigates to / with replace true and a disconnect toast
  A provider error renders an in app recovery state with retry and return home,
    a provider error is never treated as proof of disconnection
  Direct deep links such as /app/ledger/degen with no wallet return the branded
    landing page, never a host 404
  Hosting fallback file: vercel.json with
    { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
    if the build ships as a Vite SPA, or Next.js App Router native routing if
    the build ships as Next, the chosen file is named in BUILD_GUIDE.md
  Manual disconnect persists a session intent flag in memory for the tab, so a
    refresh cannot silently re enter the app after an explicit disconnect

ERROR CONTAINMENT:
  A React error boundary wraps the route outlet, it renders a branded recovery
    screen with a retry action and a return home action, it never renders a raw
    stack trace, a provider exception or a blank screen
  Connection rejection, account request failure, chain switch rejection, RPC
    failure and transaction failure each become an explicit inline or modal
    state with a retry path, none of them bubbles to a route crash

CONNECTED WALLET PILL (app interior):
  Trigger: fixed top-[52px] right-4 md:top-[60px] md:right-8 z-[200]
    bg-[var(--bg-surface)] border border-[var(--rule-strong)] rounded-full
    pl-3 pr-2.5 py-2 flex items-center gap-2
    Status dot: w-1.5 h-1.5 rounded-full bg-[var(--verified)]
    Address: font-mono text-[11px] tracking-[0.1em] text-[var(--ink-primary)]
      Format: 0x4a12…9f2c
    Chevron: inline SVG w-3 h-3 text-[var(--text-muted)]
      rotate-180 when open, transition-transform duration-[140ms]
    aria-expanded and aria-haspopup="menu" are required
    Clicking toggles the menu, it never disconnects immediately

WALLET MENU:
  Panel: absolute right-0 mt-2 w-[280px] z-[300]
    bg-[var(--bg-elevated)] border border-[var(--rule-strong)]
    rounded-[8px] shadow-[var(--shadow-md)] p-4
  Animation: initial { opacity: 0, scale: 0.95, y: -6 }
             animate { opacity: 1, scale: 1, y: 0 }
             exit    { opacity: 0, scale: 0.95, y: -6 }
             transition { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
             style { transformOrigin: 'top right' }
  Status header: flex items-center gap-2 pb-3 border-b border-[var(--rule)]
    Dot: w-1.5 h-1.5 rounded-full bg-[var(--verified)]
    Label: font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]
      Text: "WALLET CONNECTED"
  Rows (grid gap-3 pt-3):
    Full address row, font-mono text-xs text-[var(--ink-primary)] break-all,
      with a copy control, inline SVG swaps to a tick and the label reads
      "Copied" then resets after 1800ms
    Network row, label "NETWORK" value "Base"
    Status row, label "STATUS" value "Active"
    Explorer link, "View on Basescan", opens in a new tab with rel noopener
  Disconnect: mt-4 w-full text-left px-3 py-2 rounded-[4px]
    border border-[var(--accent)]/40 text-[var(--accent)]
    font-mono text-[11px] uppercase tracking-[0.16em]
    hover:bg-[var(--accent-wash)] transition-colors duration-[140ms]
    Label: "DISCONNECT WALLET"
    Behaviour: navigate to / immediately with state { disconnected: true },
      then revoke the provider connection
  Dismissal: outside pointerdown via a ref listener and Escape via a keydown
    listener bound only while open, there is no backdrop div

DISCONNECT TOAST:
  Landing page reads location state disconnected, shows a slide down toast at
    z-[600], auto dismisses after 4000ms, clears router state after reading so a
    hard refresh does not re show it
```

**Acceptance tests, run on the production deployment and at a mobile viewport before the demo**

- Connect from the landing page and confirm automatic navigation to `/app`
- Open `/app/ledger/degen` directly while connected, hard refresh, confirm the same route renders with no host 404
- Refresh `/app` while connected and confirm no landing page flash and no redirect
- Open the wallet pill, confirm the menu, the copy action, the explorer link and the disconnect action
- Disconnect, confirm immediate navigation to `/` and the toast, refresh, confirm no silent reconnection
- Open a protected deep link in a fresh session with no wallet, confirm the branded landing page
- Reject a connection and a chain switch, confirm an in app retry state and a still usable page
- Force an RPC failure, confirm the branded error boundary with recovery actions

---

## 3. Section: Hero

**Recipe:** `editorial-asymmetric-hero` (COMPOSITION_RECIPES.md, Section D), adapted
**Customisations:** the background image slot is removed entirely so the Strata Field reads through, the floating detail block is promoted into a live ledger card carrying real fixture data, content anchors bottom left with the card offset upper right

```
z-index within section: content z-10, ledger card z-20

SECTION: Hero
data-band="0" data-density="hero"
Layout: relative min-h-[100dvh] w-full overflow-hidden
Background: none, the Strata Field shows through at opacity 0.34

CONTENT COLUMN (bottom left anchor):
  Container: relative z-10 min-h-[100dvh] flex flex-col justify-end
             pb-16 md:pb-20 lg:pb-24 pt-28 px-5 md:px-10 lg:px-16

  Eyebrow:
    font-mono text-[10px] md:text-[11px] uppercase tracking-[0.26em]
    text-[var(--accent)] mb-5 md:mb-6
    Text: "PROMISE LEDGER · BASE"
    Animation: initial { opacity: 0, y: 8 } / animate { opacity: 1, y: 0 }
      duration 0.5s ease [0.16,1,0.3,1] delay 0.2s

  Headline:
    font-display font-semibold text-[var(--ink-primary)]
    text-[2.75rem] md:text-[4.25rem] lg:text-[5.75rem]
    leading-[0.94] tracking-[-0.03em] max-w-full lg:max-w-[52%]
    Two lines, hard break between them:
      "What they promised"
      "is still on record"
    Animation: word by word reveal
      Each word: initial { filter: 'blur(8px)', opacity: 0, y: 18 }
                 animate { filter: 'blur(0px)', opacity: 1, y: 0 }
      duration 0.62s, ease [0.16,1,0.3,1], stagger (wordIndex * 70)ms, base delay 0.32s

  Subheading:
    mt-6 md:mt-7 max-w-[54ch] font-body text-[0.95rem] md:text-lg
    text-[var(--text-secondary)] leading-relaxed
    Text: "Strata rebuilds every published version of a project's site and docs,
      diffs them in order, and checks every material claim that survived against
      Base, so an edit made quietly still leaves a permanent record"
    Animation: initial { opacity: 0, y: 14 } / animate { opacity: 1, y: 0 }
      duration 0.62s ease [0.16,1,0.3,1] delay 0.62s

  CTA cluster:
    mt-8 md:mt-10 flex flex-wrap items-center gap-3 md:gap-4
    Animation: initial { opacity: 0, y: 14 } / animate { opacity: 1, y: 0 }
      duration 0.62s ease [0.16,1,0.3,1] delay 0.8s

    Primary CTA (group, button in button trailing icon):
      group flex items-center gap-3 bg-[var(--accent)] text-[#fbfcfb]
      pl-6 pr-2.5 py-2.5 md:py-3 rounded-full
      font-mono text-[11px] md:text-xs uppercase tracking-[0.16em]
      hover:bg-[var(--accent-hover)] transition-colors duration-[140ms]
      Label span: "RUN A LEDGER"
      Icon wrapper: w-7 h-7 rounded-full bg-white/15 flex items-center justify-center
        group-hover:translate-x-0.5 group-hover:-translate-y-px
        transition-transform duration-200
        Icon: inline SVG arrow up right, w-3.5 h-3.5, stroke currentColor, strokeWidth 1.5
      Behaviour: connect gated, opens WalletConnectModal when disconnected

    Secondary CTA:
      border border-[var(--rule-strong)] text-[var(--ink-primary)]
      px-6 py-2.5 md:py-3 rounded-full font-mono text-[11px] md:text-xs
      uppercase tracking-[0.16em]
      hover:border-[var(--ink-primary)] transition-colors duration-[140ms]
      Label: "SEE A FINISHED LEDGER"
      Behaviour: smooth scrolls to the Ledger section, no wallet required

LEDGER CARD (floating, upper right, replaces the recipe's metadata block):
  Position: absolute z-20
    top-[7.5rem] right-5 w-[calc(100%-2.5rem)]
    md:top-32 md:right-10 md:w-[380px]
    lg:top-36 lg:right-16 lg:w-[420px]
  Outer shell (double bezel):
    p-2 rounded-[10px] bg-[var(--bg-secondary)] ring-1 ring-[var(--rule)]
  Inner core:
    rounded-[6px] bg-[var(--bg-elevated)] p-5 md:p-6
    shadow-[0_20px_40px_-15px_rgba(16,20,24,0.06)]
  Animation: initial { opacity: 0, y: 24, scale: 0.98 }
             animate { opacity: 1, y: 0, scale: 1 }
             duration 0.85s, ease [0.16,1,0.3,1], delay 0.5s

  Header row: flex items-baseline justify-between pb-3 border-b border-[var(--rule)]
    Left: font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]
      Format: "{fixtureName} · TOKENOMICS · DIFF {diffIndex}"
    Right: font-mono text-[10px] tracking-[0.12em] text-[var(--text-muted)]
      Format: "{captureDate}"

  Diff body: pt-4 flex flex-col gap-3
    Removed line:
      flex items-start gap-2
      Marker: font-mono text-[11px] text-[var(--accent)] leading-5, character "−"
      Text: font-mono text-[11px] md:text-xs leading-5 text-[var(--text-muted)]
            line-through decoration-[var(--accent)]/60
    Added line:
      flex items-start gap-2
      Marker: font-mono text-[11px] text-[var(--ink-primary)] leading-5, character "+"
      Text: font-mono text-[11px] md:text-xs leading-5 text-[var(--ink-primary)]

  Verdict row: mt-4 pt-3 border-t border-[var(--rule)] flex items-center gap-2
    Glyph: inline SVG w-3.5 h-3.5, stroke currentColor strokeWidth 1.5,
           a slashed circle for a broken promise
    Label: font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]
      Text: "CHANGED WITHOUT ANNOUNCEMENT"
    Chain line: mt-2 w-full font-mono text-[10px] tracking-[0.1em]
                text-[var(--text-secondary)]
      Format: "CHECKED AGAINST BASE AT BLOCK {blockNumber}"

  DATA RULE, non negotiable:
    Every value in this card is read from the stored Degen ingest record through
    the ledger API at render time, no value is hardcoded and no figure is invented
    for illustration
    Loading state: three skeleton bars, h-3, widths 88%, 74%, 52%,
      rounded-[2px] bg-[var(--rule)] with shimmer, never a spinner
    Failure state: the card renders its header and a single line reading
      "Ledger unavailable, retry", with a retry control, it never renders
      placeholder numbers

Mobile below md: the ledger card moves above the content column in DOM order using
  flex-col-reverse on the section wrapper, becomes static rather than absolute,
  full width minus the page gutter, so the product proof leads on small screens
```

---

## 4. Section: The Problem

**Recipe:** `full-width-statement` (COMPOSITION_RECIPES.md, Section D)
**Customisations:** palette only, no eyebrow

```
z-index: content z-10

SECTION: Problem
data-band="1" data-density="sparse"
Layout: relative py-28 md:py-40 flex items-center
Background: none, the Strata Field shows through at opacity 0.22

CONTENT:
  Container: w-full px-5 md:px-10 lg:px-16

  Statement:
    font-display font-semibold text-[var(--ink-primary)]
    text-[clamp(2rem,7vw,5.25rem)] leading-[0.96] tracking-[-0.035em]
    text-left max-w-[18ch]
    Text: "A website edit leaves no trace on the chain"
    Animation: word by word
      initial { filter: 'blur(8px)', opacity: 0, y: 18 }
      animate { filter: 'blur(0px)', opacity: 1, y: 0 }
      duration 0.6s, ease [0.16,1,0.3,1], stagger (wordIndex * 80)ms
      viewport { once: false, amount: 0.2 }

  Rule: mt-10 md:mt-12 h-px w-full bg-[var(--rule)]
    Animation: scaleX 0 -> 1, origin left, duration 0.8s ease [0.16,1,0.3,1], delay 0.5s

  Metadata line:
    mt-5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em]
    text-[var(--text-muted)] max-w-[64ch]
    Text: "PROJECTS REVISE, DELETE AND REPHRASE, STRATA KEEPS THE OLD COPY"
    Animation: opacity 0 -> 1, duration 0.6s, delay 0.75s
```

---

## 5. Section: Mechanism

**Recipe:** `architecture-layers` (COMPOSITION_RECIPES.md, Section B), adapted
**Customisations:** five layers rather than the default set, palette swapped to project variables, the layer number becomes a two digit archival index in mono, cards are rules and negative space rather than boxes per the dashboard hardening rule

```
z-index: content z-10

SECTION: Mechanism
data-band="2" data-density="dense"
Layout: relative py-24 md:py-32 bg-[var(--bg-primary)]/92 backdrop-blur-[2px]
Container: max-w-4xl mx-auto px-5 md:px-10

HEADING:
  Eyebrow: font-mono text-[10px] uppercase tracking-[0.22em]
           text-[var(--accent)] mb-4
    Text: "HOW A LEDGER IS BUILT"
  Title: font-display text-[1.9rem] md:text-[2.6rem] font-semibold
         tracking-[-0.02em] leading-[1.05] text-[var(--ink-primary)] max-w-[22ch]
    Text: "The engine owns the numbers, the model only reads prose"

LAYERS: mt-14 flex flex-col
  Each layer row:
    grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr] gap-4 md:gap-8
    py-6 md:py-7 border-t border-[var(--rule)] last:border-b
    hover:bg-[var(--bg-secondary)]/60 transition-colors duration-[200ms]
  Index: font-mono text-[11px] tracking-[0.14em] text-[var(--text-muted)] pt-1
  Body column:
    Title: font-mono text-[11px] md:text-xs uppercase tracking-[0.18em]
           text-[var(--ink-primary)]
    Description: mt-2 font-body text-sm md:text-[0.95rem]
                 text-[var(--text-secondary)] leading-relaxed max-w-[62ch]
    Owner tag: mt-3 inline-flex items-center gap-1.5 rounded-full
               border border-[var(--rule)] px-2.5 py-1
               font-mono text-[9px] uppercase tracking-[0.16em]
               text-[var(--text-muted)]

  Content:
    01 INGEST — "Every archived capture of the site and docs, plus every commit
      that touched the docs repository, each section hashed so only a section
      that genuinely changed is ever fetched in full"
      Owner tag: "DETERMINISTIC"
    02 DIFF — "Captures are ordered by time and compared pairwise, the change
      set is produced by code, no model touches this step"
      Owner tag: "DETERMINISTIC"
    03 CLASSIFY — "The model reads one diff at a time and does one job, mark the
      change cosmetic or material and extract the claim inside it as a
      structured record, it never decides whether the claim is true"
      Owner tag: "MODEL"
    04 VERIFY — "Every material claim that can be checked is checked against
      Base, supply against the token contract, allocation against the live
      holder set, locks against the locker, burns against the burn address,
      ownership and mint authority against the contract itself"
      Owner tag: "DETERMINISTIC"
    05 ATTEST — "Each verified or broken promise is written as an attestation on
      Base, so the record outlives the page being edited or deleted"
      Owner tag: "ONCHAIN"

ANIMATION:
  Each row: initial { opacity: 0, y: 18 } / whileInView { opacity: 1, y: 0 }
  duration 0.55s, ease [0.16,1,0.3,1], delay index * 0.09s
  viewport { once: false, amount: 0.1 }
```

---

## 6. Section: The Ledger (bespoke, no recipe match)

The centrepiece and the fifteen second demo, a promise timeline with a real time axis, written at the same specificity as the golden examples because no recipe covers it

```
z-index: content z-10, hovered marker z-20

SECTION: Ledger
data-band="3" data-density="dense"
Layout: relative py-24 md:py-32 bg-[var(--bg-primary)]/92 backdrop-blur-[2px]
Container: max-w-6xl mx-auto px-5 md:px-10

HEADER ROW:
  Layout: flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10
  Left:
    Title: font-display text-[1.9rem] md:text-[2.6rem] font-semibold
           tracking-[-0.02em] text-[var(--ink-primary)]
      Text: "One project, every version of the truth"
    Subtitle: mt-3 font-body text-sm md:text-base text-[var(--text-secondary)]
              max-w-[58ch] leading-relaxed
      Text: "Each marker is a published claim, its position is when it was
        published, its state is what Base says about it today"
  Right, fixture selector:
    Layout: flex flex-wrap gap-1.5
    Each control: px-3 py-1.5 rounded-full font-mono text-[10px] uppercase
      tracking-[0.14em] border transition-colors duration-[140ms]
      Inactive: border-[var(--rule)] text-[var(--text-muted)]
                hover:border-[var(--rule-strong)] hover:text-[var(--ink-primary)]
      Active:   border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-primary)]
    Controls: the five fixtures, Aerodrome, Moonwell, Degen, Seamless, Friend.tech
    Switching: AnimatePresence mode="wait" on the plot,
      exit { opacity: 0, y: 8 } duration 0.16s, enter { opacity: 0, y: -8 } to
      { opacity: 1, y: 0 } duration 0.28s ease [0.16,1,0.3,1]

PLOT:
  Wrapper: relative w-full overflow-x-auto md:overflow-visible
  Inner: min-w-[720px] md:min-w-0 relative

  Time axis (horizontal, bottom):
    Rule: absolute bottom-0 inset-x-0 h-px bg-[var(--rule-strong)]
    Tick labels: flex justify-between pt-2
      font-mono text-[10px] tracking-[0.12em] text-[var(--text-muted)]
      Format: quarter and year, derived from the fixture's real capture window,
        never a fixed range
    Axis draw in: scaleX 0 -> 1, origin left, duration 0.9s ease [0.16,1,0.3,1]

  Claim rows (vertical, one per claim category present in the record):
    Row: relative h-16 md:h-[4.5rem] border-b border-[var(--rule)] last:border-b-0
    Row label: absolute left-0 top-1/2 -translate-y-1/2 w-28 md:w-36 pr-4
      font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]
      Categories rendered only when present: SUPPLY, ALLOCATION, UNLOCKS, LOCKS,
        AUDIT, OWNERSHIP, FEES
    Track: absolute left-28 md:left-36 right-0 top-1/2 h-px bg-[var(--rule)]

  Markers (one per published version of that claim):
    Base: absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-[2px]
          border transition-all duration-[200ms]
    Position: left computed as a percentage of the capture window,
      style={{ left: `${(t - windowStart) / (windowEnd - windowStart) * 100}%` }}
    States, each carries a glyph and a text label as well as a colour:
      Held      border-[var(--verified)] bg-[var(--verified-wash)]
      Broken    border-[var(--accent)] bg-[var(--accent)]
      Unchecked border-[var(--unverifiable)] bg-[var(--unverifiable-wash)]
    Connector between consecutive markers on the same row:
      absolute h-px bg-[var(--rule-strong)]
      When the claim changed between the two markers, the connector renders
      dashed via border-t border-dashed border-[var(--accent)]/50 and carries an
      inline label above it, font-mono text-[9px] uppercase tracking-[0.14em]
      text-[var(--accent)], text "REVISED"
    Hover and focus: scale-[1.35], z-20, and the detail panel below updates,
      markers are focusable buttons with an aria-label naming the claim, the
      date and the state, so the timeline is fully keyboard navigable
    Entrance: each marker initial { opacity: 0, scale: 0.4 }
      animate { opacity: 1, scale: 1 }
      duration 0.4s, ease [0.16,1,0.3,1], stagger (markerIndex * 0.035)s
      viewport { once: false, amount: 0.1 }

DETAIL PANEL (below the plot, updates on marker hover or focus):
  Outer shell: mt-10 p-2 rounded-[10px] bg-[var(--bg-secondary)] ring-1 ring-[var(--rule)]
  Inner: rounded-[6px] bg-[var(--bg-elevated)] p-5 md:p-7
  Grid: grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-10
  Left column, the claim as published:
    Label: font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]
      Text: "AS PUBLISHED"
    Quote: mt-3 font-body text-sm md:text-base text-[var(--ink-primary)]
           leading-relaxed border-l-2 border-[var(--rule-strong)] pl-4
    Source line: mt-3 font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]
      Format: "{sourceType} · {captureTimestamp} · {sourceRef}"
      sourceRef is the archive capture id or the commit hash, and it is a link
  Right column, what the chain says:
    Label: font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]
      Text: "AS VERIFIED ON BASE"
    Rows: flex justify-between py-2.5 border-b border-[var(--rule)] last:border-0
      Key: font-body text-xs text-[var(--text-secondary)]
      Value: font-mono text-xs text-[var(--ink-primary)]
      Keys rendered: Contract, Method, Value, Block, Attestation
      Attestation value is a link to the EAS record on Basescan
    Verdict chip: mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5
      border font-mono text-[10px] uppercase tracking-[0.16em]
      Held      border-[var(--verified)] text-[var(--verified)] bg-[var(--verified-wash)]
      Broken    border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-wash)]
      Unchecked border-[var(--unverifiable)] text-[var(--unverifiable)] bg-[var(--unverifiable-wash)]
      Each chip carries its inline SVG glyph, a tick, a slashed circle, a dash

EMPTY AND LOADING STATES:
  Loading: the row skeleton renders the axis and the row labels with shimmer bars
    on each track, never a spinner
  A fixture with no material change in a category renders the row with a single
    held marker and the label "NO REVISION IN WINDOW", the row is never hidden,
    because an absent row would read as an omission
```

---

## 7. Section: Fixtures

**Recipe:** `asymmetric-bento-grid` (COMPOSITION_RECIPES.md, Section D), adapted
**Customisations:** no imagery in any cell, the visual weight comes from typography and the verdict chip, six cells maximum is respected with five fixtures plus one summary cell, hover lifts the cell by two pixels with a border shift and no scale transform

```
z-index: content z-10

SECTION: Fixtures
data-band="4" data-density="dense"
Layout: relative py-24 md:py-32
Container: max-w-6xl mx-auto px-5 md:px-10

HEADING (col-span-full, mb-10):
  Eyebrow: font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] mb-4
    Text: "RUN AGAINST REAL PROJECTS"
  Title: font-display text-[1.9rem] md:text-[2.6rem] font-semibold
         tracking-[-0.02em] text-[var(--ink-primary)] max-w-[24ch]
    Text: "Five ledgers, including the ones that come back clean"
  Note: mt-3 font-body text-sm text-[var(--text-secondary)] max-w-[62ch]
    Text: "A tool that can only accuse is not an instrument, two of these five
      are controls and Strata is expected to find nothing material in them"

GRID: grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5
  Cell A, Degen (lg:col-span-7)
  Cell B, Seamless (lg:col-span-5)
  Cell C, Aerodrome (lg:col-span-4)
  Cell D, Moonwell (lg:col-span-4)
  Cell E, Friend.tech (lg:col-span-4)
  Cell F, summary (lg:col-span-12)

CELL (A to E):
  Shell: bg-[var(--bg-surface)] border border-[var(--rule)] rounded-[8px]
         p-5 md:p-7 flex flex-col justify-between min-h-[220px]
         hover:-translate-y-0.5 hover:border-[var(--rule-strong)]
         transition-[transform,border-color] duration-[200ms]
  Top row: flex items-start justify-between gap-4
    Name: font-display text-xl md:text-2xl font-semibold text-[var(--ink-primary)]
    Role tag: font-mono text-[9px] uppercase tracking-[0.16em]
              text-[var(--text-muted)] border border-[var(--rule)]
              rounded-full px-2 py-1 whitespace-nowrap
      Values: "CONTROL", "SCHEDULE", "REWRITE", "VANISHED"
  Why line: mt-3 font-body text-sm text-[var(--text-secondary)] leading-relaxed
    Degen: "Published emission and season plans that moved over time, with the
      chain showing what was actually minted"
    Seamless: "Documentation substantially rewritten at the move off the Aave
      fork, the case the classifier must call a rewrite and not a fraud"
    Aerodrome: "A long docs history on a blue chip Base protocol, expected to
      return a clean ledger"
    Moonwell: "A second control with an active governance forum, so announced
      changes are expected to reconcile"
    Friend.tech: "The promises are gone because the site went, the attestations
      are why the ledger still holds them"
  Stat row: mt-6 pt-4 border-t border-[var(--rule)] grid grid-cols-3 gap-3
    Each stat: Key font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]
               Value font-mono text-base md:text-lg text-[var(--ink-primary)] mt-1
    Keys: "CAPTURES", "MATERIAL", "BROKEN"
    All three are read from the stored run for that fixture, none is hardcoded
  Verdict chip: mt-4, same chip component and states as §6

CELL F, summary:
  Shell: bg-[var(--bg-secondary)] border border-[var(--rule)] rounded-[8px]
         px-5 md:px-8 py-5 flex flex-col md:flex-row md:items-center
         md:justify-between gap-4
  Text: font-body text-sm text-[var(--text-secondary)] max-w-[70ch]
    "Every figure on this page comes from a stored run, the same pipeline a judge
     can trigger live from the app"
  Link: font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-primary)]
        hover:text-[var(--accent)] transition-colors duration-[140ms]
    Label: "Open the fixture runs"

ANIMATION:
  Each cell: initial { opacity: 0, y: 20 } / whileInView { opacity: 1, y: 0 }
  duration 0.55s, ease [0.16,1,0.3,1], delay index * 0.08s
  viewport { once: false, amount: 0.1 }
  No hover tilt and no 3D spring on these cells, the register is archival
```

---

## 8. Section: Coverage and Limits

**Recipe:** `split-image-text` (COMPOSITION_RECIPES.md, Section B), adapted
**Customisations:** both image slots are replaced by an evidence stack, since no photography belongs anywhere near this product

```
z-index: content z-10

SECTION: Coverage
data-band="5" data-density="sparse"
Layout: relative py-24 md:py-32
Background: none, the Strata Field shows through at opacity 0.22
Container: max-w-6xl mx-auto px-5 md:px-10
  grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start

LEFT COLUMN:
  Title: font-display text-[1.9rem] md:text-[3rem] font-semibold
         leading-[1.02] tracking-[-0.025em] text-[var(--ink-primary)] max-w-[16ch]
    Text: "What Strata cannot see, printed on the ledger"
  Body: mt-5 font-body text-base text-[var(--text-secondary)]
        leading-relaxed max-w-[58ch]
    Text: "Archive coverage is uneven, a project whose docs render entirely in the
      browser and keeps no public repository returns partial coverage rather than
      a verdict, and a claim with no onchain equivalent, a partnership or a
      roadmap date, is recorded as a promise with no proof rather than scored,
      every ledger states its own coverage as a percentage of the window that
      actually has captures"
  Animation: initial { opacity: 0, x: -18 } / whileInView { opacity: 1, x: 0 }
    duration 0.65s ease [0.16,1,0.3,1] delay 0.15s

RIGHT COLUMN, evidence stack:
  Layout: grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4
  Card (x4): border border-[var(--rule)] rounded-[6px] p-5
             bg-[var(--bg-surface)]
    Glyph: w-6 h-6 inline SVG, stroke var(--text-muted), strokeWidth 1.25
      /* Icon slot: hand written inline SVG only, never an icon library */
    Label: mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]
    Value: mt-1.5 font-body text-sm text-[var(--ink-primary)] leading-snug
    Content:
      "SOURCE" / "Archive captures plus public docs repository history"
      "VERIFIED AGAINST" / "Base mainnet state at the block printed on the row"
      "NOT SCORED" / "Any claim with no onchain equivalent, marked, never guessed"
      "COVERAGE" / "Stated per ledger as a percentage of the window with captures"
  Animation: initial { opacity: 0, x: 18 } / whileInView { opacity: 1, x: 0 }
    duration 0.65s ease [0.16,1,0.3,1] delay 0.3s, children stagger 0.08s
```

---

## 9. Section: Live Metrics

**Recipe:** `metrics-section` (COMPOSITION_RECIPES.md, Section B), adapted
**Customisations:** no video layer, hairline column dividers instead, all three values are live reads from the Strata registry contract on Base

```
z-index: content z-10

SECTION: Metrics
data-band="6" data-density="dense"
Layout: relative py-20 md:py-28 bg-[var(--bg-primary)]/92 backdrop-blur-[2px]
Container: max-w-6xl mx-auto px-5 md:px-10

Subtitle: text-center font-mono text-[10px] uppercase tracking-[0.22em]
          text-[var(--text-muted)] mb-12
  Text: "LIVE ON BASE"

Grid: grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 text-center
  Column: md:px-8 md:border-r md:border-[var(--rule)] md:last:border-r-0
  Number: font-display text-[2.75rem] md:text-[3.75rem] font-semibold
          leading-none tracking-[-0.03em] text-[var(--ink-primary)] tabular-nums
  Label: mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]

  Metric 1, label "PROJECTS ON RECORD"
  Metric 2, label "MATERIAL CHANGES FOUND"
  Metric 3, label "ATTESTATIONS ON BASE"

Animation:
  Each number counts from 0 to the fetched value over 1.5s, ease out, using the
    useCountUp hook, triggered by IntersectionObserver and replaying on re entry
  Stagger: delay 0.15s per column
  Loading: skeleton bar w-24 h-9 rounded-[2px] bg-[var(--rule)] with shimmer
  Failure: the label renders with an em space value and a retry control beneath,
    it never renders a zero as if it were real
```

---

## 10. Section: Final CTA

**Recipe:** bespoke crescendo, the Strata Field returns to full opacity and every rule on the page has already been drawn, so the closing viewport is the whole column visible at once

```
z-index: content z-10

SECTION: Final CTA
data-band="7" data-density="hero"
Layout: relative py-32 md:py-44 flex items-center justify-center overflow-hidden
Background: none, the Strata Field shows through at opacity 0.34

Container: relative z-10 max-w-3xl mx-auto px-5 md:px-10 text-center
  flex flex-col items-center

Heading:
  font-display text-[2.5rem] md:text-[4rem] font-semibold leading-[0.98]
  tracking-[-0.03em] text-[var(--ink-primary)] max-w-[16ch]
  Text: "Put a project on record"
  Animation: initial { filter: 'blur(8px)', opacity: 0, y: 20 }
             whileInView { filter: 'blur(0px)', opacity: 1, y: 0 }
             duration 0.75s ease [0.16,1,0.3,1]

Subtext:
  mt-5 font-body text-base text-[var(--text-secondary)] max-w-[48ch]
  Text: "Paste a token address or a docs URL, Strata builds the ledger and writes
    what it finds to Base"
  Animation: initial { opacity: 0, y: 14 } / whileInView { opacity: 1, y: 0 }
    duration 0.65s ease [0.16,1,0.3,1] delay 0.15s

CTA:
  Same primary CTA component as the hero, same label "RUN A LEDGER", same connect
  gated handler, mt-9
  No second CTA in this section, the page has exactly one primary action intent
  Animation: initial { opacity: 0, y: 14 } / whileInView { opacity: 1, y: 0 }
    duration 0.65s ease [0.16,1,0.3,1] delay 0.3s
```

---

## 11. Footer

```
z-index: content z-10

SECTION: Footer
data-band="8" data-density="sparse"
Layout: py-12 px-5 md:px-10 border-t border-[var(--rule)]
Background: bg-[var(--bg-primary)]

Container: max-w-6xl mx-auto flex flex-col md:flex-row md:items-start
           md:justify-between gap-8

Left:
  Wordmark: font-mono text-xs uppercase tracking-[0.32em] text-[var(--ink-primary)]
    Text: "STRATA"
    /* Logo slot: replace with public/logo.svg once provided */
  Attribution: mt-3 font-body text-xs text-[var(--text-muted)] max-w-[46ch]
    Text: "Built for the Orion Builder Hackathon, deployed on Base, attestations
      written through EAS"

Right:
  flex flex-wrap gap-x-8 gap-y-3
  Each link: font-mono text-[10px] uppercase tracking-[0.16em]
             text-[var(--text-secondary)] hover:text-[var(--accent)]
             transition-colors duration-[140ms]
  Links: "Docs", "GitHub", "X", "Telegram"

Bottom row: mt-10 pt-5 border-t border-[var(--rule)]
  flex flex-col sm:flex-row justify-between gap-2
  font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]
  Left: "STRATA 2026"
  Right: "Base mainnet"
```

---

## 12. App Interior

Three routes, all behind the gate in §2.1, the interior inherits the same design system and drops the Strata Field opacity to a flat 0.08 so data stays first

```
/app  — ledger index
  Header: font-display text-[1.75rem] md:text-2xl font-semibold, "Your ledgers"
  Empty state (required): centred block, max-w-[46ch]
    Glyph: inline SVG, w-8 h-8, stroke var(--text-muted)
    Message: font-body text-sm text-[var(--text-secondary)]
      "No ledger yet, paste a token address or a docs URL and Strata will build one"
    Action: primary CTA component, label "RUN A LEDGER"
  Populated: a table, not cards, per the dashboard hardening rule
    Wrapper: w-full border-t border-[var(--rule)]
    Row: grid grid-cols-[1fr_auto_auto_auto] gap-4 py-4
         border-b border-[var(--rule)] items-center
         hover:bg-[var(--bg-secondary)]/60 transition-colors duration-[200ms]
    Columns: project, captures, material changes, verdict chip
    Row is a link to /app/ledger/[slug], the whole row is one focusable control
    Loading: five skeleton rows with shimmer bars, never a spinner

/app/ledger/[slug] — a single ledger
  Reuses the §6 plot and detail panel components at full width
  Adds a header strip: project name, source list, coverage percentage,
    block height of the last verification, and an attest control
  Attest control: primary CTA component, label "WRITE TO BASE"
    States: idle, wallet pending, submitted with the tx hash shown in mono,
      confirmed with a Basescan link, failed with the revert reason and a retry
    It never optimistically renders a confirmed state before the receipt

/app/new — build a ledger
  Single column, max-w-[560px] mx-auto
  Field 1: token address or docs URL
    Label above the input, never a placeholder as the only label
    Input: w-full bg-[var(--bg-surface)] border border-[var(--rule-strong)]
           rounded-[4px] px-4 py-3 font-mono text-sm text-[var(--ink-primary)]
           focus:border-[var(--accent)] outline-none transition-colors duration-[140ms]
    Validation: client side before submit, field level error message beneath in
      font-mono text-[10px] text-[var(--accent)], focus moves to the first
      invalid field on a failed submit
  Field 2: optional docs repository URL, same treatment
  Submit: primary CTA component, label "BUILD LEDGER"
  Progress: the five mechanism stages render as a live checklist while the run
    executes, each stage showing ingest counts as they arrive, so a judge watches
    the engine work rather than a loading bar
```

---

## 13. Responsive Summary

- Hero stacks below `lg`, the ledger card leads on mobile via `flex-col-reverse`, the headline drops to `text-[2.75rem]` and never exceeds two lines
- Masthead ticker is removed below `md` rather than compressed, the issue line keeps the snapshot count only
- Ledger plot scrolls horizontally below `md` inside `overflow-x-auto` with a `min-w-[720px]` inner, and the row label column narrows from `w-36` to `w-28`
- Fixtures bento collapses to a single column below `lg`, the summary cell stays last
- Metrics columns lose their vertical dividers below `md` and gain `gap-10`
- Every headline steps through three breakpoints minimum, no bare `text-7xl` anywhere
- Strata Field band count drops from 34 to 18 below `md`, read once on mount and on a debounced resize, to protect frame rate
- All touch targets are at least 44 by 44 pixels, including the timeline markers, which take an invisible `::after` hit area of `w-11 h-11` centred on the marker
- No horizontal overflow at any viewport, verified at 320, 375, 768, 1024, 1280 and 1536 pixels

---

## 14. Asset Brief Summary

No photography, no video, no 3D model and no generated imagery anywhere in this project

The only visual system is the Strata Field, which is coded, specified in full in §1.4, plus the micro noise overlay in §1.5, which is a mathematically generated inline SVG and not a file

Every icon is hand written inline SVG, no icon library is installed

```
/* Logo slot: replace with public/logo.svg once provided */
<!-- Favicon slot: replace with public/favicon.ico once provided -->
```

Neither is substituted with a generated mark, a letterform or an emoji under any circumstance

---

## 15. Spec Self Check (Rule 7)

- [x] Every element has exact Tailwind classes, no vague descriptions
- [x] Every animation states initial, animate, duration, ease and delay
- [x] Every section declares its position against the global z index map, and the map is a named semantic scale
- [x] No image or video asset is required, the Strata Field is specified as a complete coded system
- [x] Every positional and sizing class carries responsive breakpoints
- [x] Composition recipes are referenced by name where a match existed, bespoke sections are written at the same specificity where none did
- [x] No placeholder copy, every headline, label and chip in this file is final text
- [x] No invented figures, every number on the page is a live read with a specified loading state and a specified failure state
- [x] Scroll animations use `viewport={{ once: false, amount: 0.1 }}` throughout, none uses `once: true`
- [x] Wallet connection, hydration, protected routing, deep link and refresh behaviour, the wallet menu, disconnect routing, the error boundary and the acceptance tests are all specified explicitly
- [x] Empty, loading, error and failure states are specified for every async surface
- [x] A junior developer could build this without asking a single design question
