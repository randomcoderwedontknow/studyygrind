import type { AccessibilityPrefs } from "../types";

export function applyAccessibilityToBody(prefs: AccessibilityPrefs) {
  const b = document.body;
  b.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
  b.classList.toggle("a11y-high-contrast", prefs.highContrast);
  b.classList.toggle("a11y-large-targets", prefs.largeTargets);
  b.classList.toggle("a11y-liquid-off", prefs.liquidUiEnabled === false);
  b.classList.remove("a11y-large-text", "a11y-xl-text");
  if (prefs.textScale === "large") b.classList.add("a11y-large-text");
  if (prefs.textScale === "xl") b.classList.add("a11y-xl-text");
}

export function applyThemeSurfaceToBody(surface: "classic" | "liquid") {
  document.body.dataset.surface = surface;
}
