import type { AppStore, Tab, UserData } from "../types";

/** Beta feature pages — require beta area (betaShellActive) to open. */
export const BETA_FEATURE_TABS: Tab[] = ["betaHome", "focusPresetLab", "routineBuilder", "goals"];

export function isBetaFeatureTab(tab: Tab): boolean {
  return BETA_FEATURE_TABS.includes(tab);
}

/** Owner or explicit per-user grant from Owner Settings. */
export function hasBetaProgramAccess(user: UserData | undefined): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  return Boolean(user.betaProgramAccess);
}

export function canEnterBetaProgram(user: UserData | undefined, _store?: AppStore): boolean {
  return hasBetaProgramAccess(user);
}

export function isBetaShell(user: UserData | undefined, _store?: AppStore): boolean {
  if (!user?.betaShellActive) return false;
  return hasBetaProgramAccess(user);
}

export function shouldShowBetaEntry(user: UserData | undefined, store: AppStore): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  if (!store.betaProgramEnabled) return false;
  return Boolean(user.betaProgramAccess);
}
