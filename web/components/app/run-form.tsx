'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PrimaryCta } from '@/components/ui';
import { fetchJson } from '@/lib/fetcher';
import { StageChecklist } from './stage-checklist';

type Stage = 'queued' | 'ingesting' | 'diffing' | 'classifying' | 'verifying' | 'complete' | 'partial' | 'failed';

interface RunStatus {
  status: Stage;
  captureCount?: number;
}

/**
 * The run form with field level validation before submit, and the five
 * mechanism stages rendered as a live checklist while the run executes, so a
 * judge watches the engine work rather than a loading bar.
 * @returns the run form element
 */
export function RunForm() {
  const [target, setTarget] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const run = useQuery<RunStatus>({
    queryKey: ['run', slug],
    queryFn: () => fetchJson<RunStatus>(`/api/ledger/${slug}`),
    enabled: slug !== null,
    refetchInterval: 2000,
  });

  const status = slug === null ? null : run.data?.status ?? 'queued';

  if ((status === 'complete' || status === 'partial') && slug) {
    return (
      <div className="mt-10 flex flex-col gap-4">
        <p className="font-body text-sm text-[var(--text-secondary)]">
          Run finished with status {status.toUpperCase()}
        </p>
        <a
          href={`/app/ledger/${slug}`}
          className="mono w-fit rounded-full border border-[var(--rule-strong)] px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-primary)] transition-colors duration-[140ms] hover:border-[var(--ink-primary)]"
        >
          Open the ledger
        </a>
      </div>
    );
  }

  const submit = () => {
    const trimmed = target.trim();
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
    const isUrl = /^https?:\/\/.+\..+/.test(trimmed);
    if (!isAddress && !isUrl) {
      setError('Enter a valid token address or a docs URL starting with https://');
      return;
    }
    setError(null);
    void fetch('/api/ledger', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target: trimmed, repoUrl: repoUrl.trim() || null }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { slug?: string; error?: string };
        if (!response.ok || !payload.slug) {
          throw new Error(payload.error ?? 'run could not be queued');
        }
        setSlug(payload.slug);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'run could not be queued');
      });
  };

  return (
    <div className="mt-10 flex flex-col gap-6">
      <div>
        <label
          htmlFor="target"
          className="mono mb-2 block text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]"
        >
          Token address or docs URL
        </label>
        <input
          id="target"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          disabled={slug !== null}
          className="w-full rounded-[4px] border border-[var(--rule-strong)] bg-[var(--bg-surface)] px-4 py-3 font-mono text-sm text-[var(--ink-primary)] outline-none transition-colors duration-[140ms] focus:border-[var(--accent)]"
        />
        {error && (
          <p className="mono mt-2 text-[10px] tracking-[0.08em] text-[var(--accent)]">{error}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="repo"
          className="mono mb-2 block text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]"
        >
          Docs repository URL, optional
        </label>
        <input
          id="repo"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          disabled={slug !== null}
          className="w-full rounded-[4px] border border-[var(--rule-strong)] bg-[var(--bg-surface)] px-4 py-3 font-mono text-sm text-[var(--ink-primary)] outline-none transition-colors duration-[140ms] focus:border-[var(--accent)]"
        />
      </div>
      {slug === null ? (
        <div>
          <PrimaryCta label="Build ledger" />
        </div>
      ) : (
        <StageChecklist status={status} slug={slug} />
      )}
    </div>
  );
}
