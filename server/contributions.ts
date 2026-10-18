import type { ContributionDay, Contributions } from "../shared/model.js";
import { bucketLevel } from "../shared/heatmap.js";

const attr = (tag: string, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

const asLevel = (value: number): 0 | 1 | 2 | 3 | 4 | null =>
  Number.isInteger(value) && value >= 0 && value <= 4
    ? (value as 0 | 1 | 2 | 3 | 4)
    : null;

// The public contributions calendar is a server-rendered HTML fragment.
// Keep the parser tolerant: cells carry the level, tool-tips carry the count.
export function parseContributionsHtml(html: string): ContributionDay[] {
  const cells: { date: string; level: 0 | 1 | 2 | 3 | 4 | null; id: string }[] =
    [];
  for (const tag of html.match(/<td\b[^>]*>/g) ?? []) {
    if (!/class="[^"]*ContributionCalendar-day/.test(tag)) continue;
    const date = attr(tag, "data-date");
    const id = attr(tag, "id");
    if (!date || !id) continue;
    cells.push({ date, level: asLevel(Number(attr(tag, "data-level"))), id });
  }
  // A real calendar holds at least 300 daily cells; anything less is an error page.
  if (cells.length < 300) throw new Error("invalid contributions html");
  const counts = new Map<string, number>();
  for (const match of html.matchAll(
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g,
  )) {
    // Counts lead the tool-tip ("3 contributions on…"); "No contributions…"
    // starts with a word instead, so leading digits alone are reliable.
    const lead = /^\s*(\d+)/.exec(match[2]);
    counts.set(match[1], lead ? Number(lead[1]) : 0);
  }
  const days: ContributionDay[] = [];
  for (const cell of cells) {
    const count = counts.get(cell.id) ?? 0;
    if (count > 0)
      days.push({ date: cell.date, count, level: cell.level ?? bucketLevel(count) });
  }
  return days;
}

export function createContributionsService(
  fetcher: typeof fetch = fetch,
  user: string = (process.env.GITHUB_USER ?? "zzpioneer").trim(),
) {
  const cache = new Map<
    number,
    {
      cached: Contributions | null;
      nextFetch: number;
      pending: Promise<Contributions> | null;
    }
  >();
  return async function contributions(year: number): Promise<Contributions> {
    if (!user) return { available: false };
    let entry = cache.get(year);
    if (!entry) {
      // Bound the cache used by the year picker and admin previews.
      if (cache.size >= 8) cache.delete(cache.keys().next().value!);
      entry = { cached: null, nextFetch: 0, pending: null };
      cache.set(year, entry);
    }
    const state = entry;
    if (Date.now() < state.nextFetch && state.cached) return state.cached;
    if (state.pending) return state.pending;
    state.pending = (async () => {
      try {
        const query = new URLSearchParams({
          from: `${year}-01-01`,
          to: `${year}-12-31`,
        });
        const res = await fetcher(
          `https://github.com/users/${encodeURIComponent(user)}/contributions?${query}`,
          {
            signal: AbortSignal.timeout(8000),
            headers: { "user-agent": "momo-blog" },
          },
        );
        if (!res.ok) throw new Error("contributions unavailable");
        const days = parseContributionsHtml(await res.text());
        state.cached = {
          available: true,
          user,
          year,
          days,
          updatedAt: new Date().toISOString(),
          stale: false,
        };
        state.nextFetch = Date.now() + 30 * 60_000;
      } catch {
        state.cached = state.cached?.available
          ? { ...state.cached, stale: true }
          : { available: false };
        state.nextFetch = Date.now() + 10 * 60_000;
      }
      return state.cached;
    })().finally(() => {
      state.pending = null;
    });
    return state.pending;
  };
}
