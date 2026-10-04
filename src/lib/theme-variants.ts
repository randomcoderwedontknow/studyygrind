import type { ThemeId, ThemeSurface, UserData } from "../types";

export function normalizeThemeId(id: string): string {
  return id === "gold" ? "sandyGold" : id;
}

export function isRotatingThemeId(id: string): boolean {
  return id.startsWith("rot-");
}

export function themeVariantsOwned(user: UserData): Partial<Record<ThemeId, { classic?: boolean; liquid?: boolean }>> {
  return user.themeVariantsOwned ?? {};
}

export function rotatingVariantsOwned(user: UserData): Record<string, { classic?: boolean; liquid?: boolean }> {
  return user.rotatingThemeVariantsOwned ?? {};
}

export function ownsThemeClassic(user: UserData, id: ThemeId): boolean {
  if (id === "green") return true;
  const v = themeVariantsOwned(user)[id];
  if (v?.classic) return true;
  if (v?.liquid) return false;
  return user.ownedThemes.includes(id);
}

export function ownsThemeLiquid(user: UserData, id: ThemeId): boolean {
  if (id === "green") return true;
  const v = themeVariantsOwned(user)[id];
  if (v?.liquid) return true;
  return false;
}

export function ownsRotatingClassic(user: UserData, id: string): boolean {
  const v = rotatingVariantsOwned(user)[id];
  if (v?.classic) return true;
  if (v?.liquid) return false;
  return user.ownedRotatingThemeIds.includes(id);
}

export function ownsRotatingLiquid(user: UserData, id: string): boolean {
  return Boolean(rotatingVariantsOwned(user)[id]?.liquid);
}

export function grantThemeSurface(
  owned: Partial<Record<ThemeId, { classic?: boolean; liquid?: boolean }>>,
  id: ThemeId,
  surface: ThemeSurface,
): Partial<Record<ThemeId, { classic?: boolean; liquid?: boolean }>> {
  const prev = owned[id] ?? {};
  return {
    ...owned,
    [id]: { ...prev, [surface]: true },
  };
}

export function revokeThemeSurface(
  owned: Partial<Record<ThemeId, { classic?: boolean; liquid?: boolean }>>,
  id: ThemeId,
  surface: ThemeSurface,
): Partial<Record<ThemeId, { classic?: boolean; liquid?: boolean }>> {
  if (id === "green") return owned;
  const prev = owned[id] ?? {};
  const next = { ...prev, [surface]: false };
  if (!next.classic && !next.liquid) {
    const copy = { ...owned };
    delete copy[id];
    return copy;
  }
  return { ...owned, [id]: next };
}

export function revokeRotatingSurface(
  owned: Record<string, { classic?: boolean; liquid?: boolean }>,
  id: string,
  surface: ThemeSurface,
): Record<string, { classic?: boolean; liquid?: boolean }> {
  const prev = owned[id] ?? {};
  const next = { ...prev, [surface]: false };
  if (!next.classic && !next.liquid) {
    const copy = { ...owned };
    delete copy[id];
    return copy;
  }
  return { ...owned, [id]: next };
}

export function grantRotatingSurface(
  owned: Record<string, { classic?: boolean; liquid?: boolean }>,
  id: string,
  surface: ThemeSurface,
): Record<string, { classic?: boolean; liquid?: boolean }> {
  const prev = owned[id] ?? {};
  return { ...owned, [id]: { ...prev, [surface]: true } };
}

export function canEquipThemeSurface(user: UserData, themeId: string, surface: ThemeSurface): boolean {
  if (isRotatingThemeId(themeId)) {
    return surface === "liquid" ? ownsRotatingLiquid(user, themeId) : ownsRotatingClassic(user, themeId);
  }
  const tid = normalizeThemeId(themeId) as ThemeId;
  if (themeId.startsWith("user-theme-")) {
    const custom = user.savedCustomThemes.find((t) => t.id === themeId);
    if (custom?.liquidUi === false && surface === "liquid") return false;
    if (custom?.liquidUi === true && surface === "classic") return false;
    return true;
  }
  return surface === "liquid" ? ownsThemeLiquid(user, tid) : ownsThemeClassic(user, tid);
}

export function effectiveLiquidSurface(user: UserData): ThemeSurface {
  if (user.accessibility?.liquidUiEnabled === false) return "classic";
  const id = user.equippedTheme;
  const custom = user.savedCustomThemes.find((t) => t.id === id);
  if (custom) return custom.liquidUi === false ? "classic" : "liquid";
  const surface = user.equippedThemeSurface ?? "classic";
  if (!canEquipThemeSurface(user, id, surface)) {
    return canEquipThemeSurface(user, id, "classic") ? "classic" : "liquid";
  }
  return surface;
}
