/**
 * JSON fetch helper that throws on non-ok responses and returns parsed data.
 * @param url - the endpoint to fetch
 * @returns the parsed JSON body, typed as T
 */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`fetch failed for ${url} with status ${response.status}`);
  }
  return (await response.json()) as T;
}
