/**
 * The site footer with wordmark, attribution and external links.
 * @returns the footer element
 */
export function Footer() {
  const links = [
    { label: 'Docs', href: 'https://github.com/dr4ken-soul/Strata#readme' },
    { label: 'GitHub', href: 'https://github.com/dr4ken-soul/Strata' },
    { label: 'X', href: 'https://x.com' },
    { label: 'Telegram', href: 'https://t.me' },
  ];
  return (
    <footer className="border-t border-[var(--rule)] bg-[var(--bg-primary)] px-5 py-12 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[0.32em] text-[var(--ink-primary)]">STRATA</p>
          <p className="mt-3 max-w-[46ch] font-body text-xs text-[var(--text-muted)]">
            Built for the Orion Builder Hackathon, deployed on Base, attestations written through EAS
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors duration-[140ms] hover:text-[var(--accent)]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col justify-between gap-2 border-t border-[var(--rule)] pt-5 sm:flex-row">
        <p className="mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">STRATA 2026</p>
        <p className="mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">Base mainnet</p>
      </div>
    </footer>
  );
}
