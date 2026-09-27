import { registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isAndroid } from "./native";

let notifPermGranted: boolean | null = null;
async function ensureAndroidNotificationPermission(): Promise<boolean> {
  if (!isAndroid) return false;
  if (notifPermGranted === true) return true;
  if (notifPermGranted === false) return false;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "granted") {
      notifPermGranted = true;
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    notifPermGranted = req.display === "granted";
    return notifPermGranted;
  } catch {
    notifPermGranted = true;
    return true;
  }
}

export type FocusTimerNotifState = {
  running: boolean;
  paused: boolean;
  secondsLeft: number;
  phase: "focus" | "break";
};

type FocusTimerNotificationPlugin = {
  update(options: FocusTimerNotifState): Promise<void>;
  dismiss(): Promise<void>;
};

const Native = registerPlugin<FocusTimerNotificationPlugin>("FocusTimerNotification", {
  web: () =>
    Promise.resolve({
      update: async () => {},
      dismiss: async () => {},
    }),
});

export async function syncFocusTimerNotification(state: FocusTimerNotifState | null): Promise<void> {
  if (!isAndroid) return;
  try {
    if (!state || state.phase !== "focus") {
      await Native.dismiss();
      return;
    }
    if (!(await ensureAndroidNotificationPermission())) return;
    await Native.update(state);
  } catch (err) {
    console.warn("[StudyGrind] focus timer notification:", err);
  }
}

type FocusTimerNotificationEvents = {
  addListener(
    event: "timerAction",
    cb: (data: { action: string }) => void,
  ): Promise<{ remove: () => void }>;
};

const Events = registerPlugin<FocusTimerNotificationEvents>("FocusTimerNotification");

export function listenTimerNotificationActions(handlers: {
  onPauseToggle: () => void;
  onAddFive: () => void;
  onEnd: () => void;
}): () => void {
  if (!isAndroid) return () => {};
  let handle: { remove: () => void } | undefined;
  void Events.addListener("timerAction", (data) => {
    if (data.action === "pause") handlers.onPauseToggle();
    if (data.action === "add5") handlers.onAddFive();
    if (data.action === "end") handlers.onEnd();
  }).then((h) => {
    handle = h;
  });
  return () => handle?.remove();
}
