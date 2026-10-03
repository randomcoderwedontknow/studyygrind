import { UNLOCK_IDS, FOCUS_LAB_PRICE, COLOUR_MAKER_PRICE } from "../data/constants";
import { BETA_SHELL_TABS, BETA_ONLY_TABS, isBetaShell } from "./beta-shell";
import type { AppStore, Tab, UserData } from "../types";

export type LockedPageDef = {
  tab: Tab;
  unlockKey: string;
  shopName: string;
  price: number;
};

export const LOCKED_PAGES: LockedPageDef[] = [
  { tab: "focusLab", unlockKey: UNLOCK_IDS.focusLab, shopName: "Focus Lab", price: FOCUS_LAB_PRICE },
  { tab: "themeStudio", unlockKey: UNLOCK_IDS.colourMaker, shopName: "Colour & Gradient Studio", price: COLOUR_MAKER_PRICE },
];

export function canAccessTab(
  tab: Tab,
  user: UserData | undefined,
  hasUnlock: (key: string) => boolean,
  store?: AppStore,
): boolean {
  if (!user) return false;
  const storeSafe = store ?? ({ betaProgramEnabled: false } as AppStore);
  const inBeta = isBetaShell(user, storeSafe);

  if (inBeta) {
    return BETA_SHELL_TABS.includes(tab);
  }
  if (BETA_ONLY_TABS.includes(tab)) {
    return false;
  }

  if (tab === "ownerSettings") return user.role === "owner";
  const gate = LOCKED_PAGES.find((p) => p.tab === tab);
  if (!gate) return true;
  return hasUnlock(gate.unlockKey);
}

export function shopItemForTab(tab: Tab): LockedPageDef | undefined {
  return LOCKED_PAGES.find((p) => p.tab === tab);
}
