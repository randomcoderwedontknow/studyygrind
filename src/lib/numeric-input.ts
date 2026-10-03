/** Clamp a parsed number; NaN / empty uses fallback. */
export function clampNumeric(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampInteger(value: number, min: number, max: number, fallback: number): number {
  return clampNumeric(Math.round(value), min, max, fallback);
}

export function parseDraftNumber(raw: string): number {
  const t = raw.trim();
  if (t === "") return NaN;
  return Number(t);
}

/** Allow typing while editing — digits only (optional single decimal). */
export function isAllowedNumericDraft(raw: string, allowDecimal = false): boolean {
  if (raw === "") return true;
  if (allowDecimal) return /^\d*\.?\d*$/.test(raw);
  return /^\d+$/.test(raw);
}
