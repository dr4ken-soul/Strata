/**
 * Formats an address as a truncated form, 0x4a12…9f2c.
 * @param address - the full hex address
 * @returns the truncated address, or an empty string for invalid input
 */
export function truncateAddress(address: string): string {
  if (!address.startsWith('0x') || address.length < 10) return '';
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

/**
 * Formats a unix seconds timestamp as YYYY-MM-DD.
 * @param seconds - unix seconds
 * @returns the formatted date string
 */
export function formatDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

/**
 * Formats a unix seconds timestamp as a quarter label like Q3 2024.
 * @param seconds - unix seconds
 * @returns the quarter and year label
 */
export function formatQuarter(seconds: number): string {
  const date = new Date(seconds * 1000);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${quarter} ${date.getUTCFullYear()}`;
}

/**
 * Formats a relative time like "4m ago" from unix seconds.
 * @param seconds - unix seconds
 * @returns a relative time label
 */
export function relativeTime(seconds: number): string {
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}
