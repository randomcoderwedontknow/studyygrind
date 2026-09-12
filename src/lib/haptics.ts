import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative } from "./native";

/**
 * Haptic helpers — no-ops on web. Gated by the user's `hapticsEnabled` setting,
 * which the context mirrors into `setHapticsEnabled` so callers never need the user object.
 */
let enabled = true;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function hapticsAvailable(): boolean {
  return isNative;
}

function fire(fn: () => Promise<void>): void {
  if (!isNative || !enabled) return;
  fn().catch(() => {
    /* device without vibrator — ignore */
  });
}

/** Chips, toggles, small confirmations. */
export function hapticLight(): void {
  fire(() => Haptics.impact({ style: ImpactStyle.Light }));
}

/** Timer start/pause, primary actions. */
export function hapticMedium(): void {
  fire(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

/** Session complete, task done, reward popup. */
export function hapticSuccess(): void {
  fire(() => Haptics.notification({ type: NotificationType.Success }));
}

/** Navigation taps (bottom nav, drawer items). */
export function hapticSelection(): void {
  fire(() => Haptics.selectionStart().then(() => Haptics.selectionChanged()).then(() => Haptics.selectionEnd()));
}
