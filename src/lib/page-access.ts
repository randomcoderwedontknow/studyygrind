import {
  UNLOCK_IDS,
  MENTOR_HUB_PRICE,
  FOCUS_LAB_PRICE,
  COLOUR_MAKER_PRICE,
} from "../data/constants";
import type { Tab, UserData } from "../types";

export type LockedPageDef = {
  tab: Tab;
  unlockKey: string;
  shopName: string;
  price: number;
};

export const LOCKED_PAGES: LockedPageDef[] = [
  { tab: "focusLab", unlockKey: UNLOCK_IDS.focusLab, shopName: "Focus Lab", price: FOCUS_LAB_PRICE },
  { tab: "themeStudio", unlockKey: UNLOCK_IDS.colourMaker, shopName: "Colour & Gradient Studio", price: COLOUR_MAKER_PRICE },
  { tab: "mentor", unlockKey: UNLOCK_IDS.mentorHub, shopName: "Mentor Hub", price: MENTOR_HUB_PRICE },
];

export function canAccessTab(tab: Tab, user: UserData | undefined, hasUnlock: (key: string) => boolean): boolean {
  if (!user) return false;
  if (tab === "ownerSettings") return user.role === "owner";
  const gate = LOCKED_PAGES.find((p) => p.tab === tab);
  if (!gate) return true;
  if (tab === "mentor" && user.honoraryAccess) return true;
  return hasUnlock(gate.unlockKey);
}

export function shopItemForTab(tab: Tab): LockedPageDef | undefined {
  return LOCKED_PAGES.find((p) => p.tab === tab);
}
