/** Inline style for theme preview swatches (always show both colors when available). */
export function themeSwatchStyle(meta: {
  color: string;
  color2?: string;
  gradient?: boolean;
}): { background: string; backgroundImage?: string } {
  if (meta.color2) {
    return {
      background: meta.color,
      backgroundImage: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color2} 100%)`,
    };
  }
  return { background: meta.color };
}