import { Preferences } from "@capacitor/preferences";
import { registerPlugin } from "@capacitor/core";
import { isAndroid } from "./native";
import type { UserData } from "../types";

/**
 * Home-screen widget bridge.
 *
 * Web layer writes a JSON snapshot into Capacitor Preferences under `widget_data`.
 * On Android, Preferences is backed by a SharedPreferences file whose name is the plugin
 * "group" — the plugin ignores `Preferences.group` in capacitor.config.ts and only honours a
 * runtime `Preferences.configure()` call, so we pin the group explicitly here.
 * `StudyGrindWidget.java` reads the same file/key, so no extra copying is needed.
 * After writing we ask the native `WidgetBridge` plugin to broadcast an update so
 * the widget repaints immediately instead of waiting for its periodic refresh.
 */
export const WIDGET_DATA_KEY = "widget_data";
/** Must match StudyGrindWidget.PREFS_GROUP on the Java side. */
export const WIDGET_PREFS_GROUP = "CapacitorStorage";

let configured = false;
async function ensureConfigured(): Promise<void> {
  if (configured) return;
  configured = true;
  try {
    await Preferences.configure({ group: WIDGET_PREFS_GROUP });
  } catch {
    /* web / older plugin — default group is already CapacitorStorage */
  }
}

export type WidgetData = {
  todayMinutes: number;
  streak: number;
  points: number;
  username: string;
  updatedAt: string;
  nextTaskTitle: string;
  nextTaskId: string;
  timerRunning: boolean;
  timerSecondsLeft: number;
  focusDurationMin: number;
};

type WidgetBridgePlugin = {
  refresh(): Promise<void>;
};

const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge", {
  web: () => Promise.resolve({ refresh: async () => {} }),
});

export function buildWidgetData(
  user: UserData,
  timer?: { running: boolean; secondsLeft: number } | null,
): WidgetData {
  const todayKey = new Date().toISOString().slice(0, 10);
  const next = user.tasks.find((t) => t.status !== "done");
  return {
    todayMinutes: user.weeklyHistory?.[todayKey] ?? 0,
    streak: user.streak ?? 0,
    points: user.focusPoints ?? 0,
    username: user.username ?? "",
    updatedAt: new Date().toISOString(),
    nextTaskTitle: next?.title ?? "",
    nextTaskId: next?.id ?? "",
    timerRunning: timer?.running ?? false,
    timerSecondsLeft: timer?.secondsLeft ?? 0,
    focusDurationMin: user.focusDurationMin ?? 25,
  };
}

export async function refreshWidgets(): Promise<void> {
  if (!isAndroid) return;
  try {
    await WidgetBridge.refresh();
  } catch (err) {
    console.warn("[StudyGrind] widget refresh failed:", err);
  }
}

export async function syncWidgetData(
  user: UserData,
  timer?: { running: boolean; secondsLeft: number } | null,
): Promise<void> {
  if (!isAndroid) return;
  try {
    await ensureConfigured();
    await Preferences.set({ key: WIDGET_DATA_KEY, value: JSON.stringify(buildWidgetData(user, timer)) });
    await refreshWidgets();
  } catch (err) {
    console.warn("[StudyGrind] widget sync failed:", err);
  }
}
