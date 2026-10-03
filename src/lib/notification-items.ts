import { pointsEventStatus } from "./point-multiplier";
import type { AppStore, UserData } from "../types";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: "inbox" | "announcement" | "event" | "milestone";
};

export function buildNotificationItems(user: UserData, store: AppStore): NotificationItem[] {
  const items: NotificationItem[] = [];
  user.inbox.forEach((msg, i) => {
    items.push({ id: `inbox-${i}`, title: "Message", body: msg, kind: "inbox" });
  });
  if (store.announcement) {
    items.push({
      id: "announcement",
      title: "Announcement",
      body: store.announcement.text,
      kind: "announcement",
    });
  }
  const eventStatus = pointsEventStatus(store);
  if (eventStatus.multiplier > 1) {
    items.push({
      id: "global-event",
      title: eventStatus.label ?? "Points event",
      body: `${eventStatus.multiplier}× points active${eventStatus.scheduledActive ? " (bonus day)" : ""}`,
      kind: "event",
    });
  }
  (user.recentMilestones ?? []).forEach((m) => {
    items.push({
      id: `milestone-${m.id}`,
      title: m.title,
      body: m.subtitle,
      kind: "milestone",
    });
  });
  return items;
}

export function visibleNotificationItems(user: UserData, store: AppStore): NotificationItem[] {
  const dismissed = new Set(user.dismissedNotifications ?? []);
  return buildNotificationItems(user, store).filter((i) => !dismissed.has(i.id));
}

export function hasUnreadNotifications(user: UserData, store: AppStore): boolean {
  return visibleNotificationItems(user, store).length > 0;
}
