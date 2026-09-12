import { buildTitlePool, seededPick } from "./generators";

export const TITLE_POOL = buildTitlePool(520);

export function pickWeeklyTitles(weekKey: string, count: number): { id: string; label: string }[] {
  const picks = seededPick(TITLE_POOL, `titles-${weekKey}`, count);
  return picks.map((label, i) => ({
    id: `weekly-title-${weekKey}-${i}`,
    label,
  }));
}
