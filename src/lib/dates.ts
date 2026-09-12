/** Local calendar date as YYYY-MM-DD */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalize legacy toDateString() or ISO to YYYY-MM-DD */
export function normalizeDateKey(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return todayKey(d);
}

/** Whole calendar days between date key and today (positive = date is in the past) */
export function dayDiff(dateKey: string): number {
  const key = normalizeDateKey(dateKey);
  if (!key) return 999;
  const [y, m, d] = key.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today.getTime() - then.getTime()) / 86400000);
}

export function isTodayKey(dateKey: string): boolean {
  return normalizeDateKey(dateKey) === todayKey();
}
