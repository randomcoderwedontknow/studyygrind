/** Slightly brighten/shift hex for liquid UI variant swatches. */
export function liquidShiftColor(hex: string, amount = 0.12): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  const out = (mix(r) << 16) | (mix(g) << 8) | mix(b);
  return `#${out.toString(16).padStart(6, "0")}`;
}

export function appearanceForSurface(
  color: string,
  color2: string | undefined,
  gradient: boolean | undefined,
  surface: "classic" | "liquid",
): { color: string; color2?: string; gradient?: boolean } {
  if (surface !== "liquid") return { color, color2, gradient };
  return {
    color: liquidShiftColor(color, 0.1),
    color2: color2 ? liquidShiftColor(color2, 0.14) : liquidShiftColor(color, 0.16),
    gradient: gradient ?? Boolean(color2),
  };
}
