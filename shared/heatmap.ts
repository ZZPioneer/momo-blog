export interface HeatMonth {
  label: string;
  column: number;
  span: number;
}
export interface YearGrid {
  year: number;
  weeks: number;
  days: (string | null)[];
  months: HeatMonth[];
}

const DAY = 86400000;
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Cells are laid out column-first: index i sits at column floor(i/7), row i%7.
// Monday is the first row, matching the GitHub contribution calendar.
export function buildYearGrid(year: number): YearGrid {
  const first = Date.UTC(year, 0, 1);
  const lead = (new Date(first).getUTCDay() + 6) % 7;
  const total = Math.round((Date.UTC(year + 1, 0, 1) - first) / DAY);
  const weeks = Math.ceil((lead + total) / 7);
  const days: (string | null)[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const offset = i - lead;
    days.push(offset < 0 || offset >= total ? null : isoDate(first + offset * DAY));
  }
  const months: HeatMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const offset = Math.round((Date.UTC(year, m, 1) - first) / DAY);
    const column = Math.floor((lead + offset) / 7);
    if (column >= weeks) continue;
    months.push({
      label: `${m + 1}月`,
      column,
      span: Math.min(3, weeks - column),
    });
  }
  return { year, weeks, days, months };
}

export function articleLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export function bucketLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}
