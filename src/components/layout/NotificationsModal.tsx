import { Bell, Megaphone, Sparkles, Zap } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { pointsEventStatus } from "../../lib/point-multiplier";
import { getNotificationService, syncNotificationSchedule } from "../../lib/notifications";
import { isNative } from "../../lib/native";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

export function NotificationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, store, updateUser, setToast } = useStudyGrind();
  if (!user) return null;

  const items: { id: string; title: string; body: string; kind: "inbox" | "announcement" | "event" | "milestone" }[] = [];

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

  (user.recentMilestones ?? []).slice(0, 3).forEach((m) => {
    items.push({
      id: `milestone-${m.id}`,
      title: m.title,
      body: m.subtitle,
      kind: "milestone",
    });
  });

  const toggleNotifications = async () => {
    const next = !user.notifications;
    if (next && isNative) {
      const svc = await getNotificationService();
      if (svc.isSupported()) await svc.requestPermission();
    }
    updateUser({ ...user, notifications: next, notificationPref: next });
    await syncNotificationSchedule(next);
    setToast(next ? "Daily study reminders on" : "Reminders off");
  };

  const clearInbox = () => {
    if (user.inbox.length === 0) return;
    updateUser({ ...user, inbox: [] });
    setToast("Inbox cleared");
  };

  return (
    <Modal open={open} title="Notifications" onClose={onClose}>
      <div className="notifications-toggle-row">
        <div>
          <b>
            <Bell size={14} /> Daily study reminders
          </b>
          <p className="soft">
            {user.notifications
              ? isNative
                ? "On — reminder around 5:00 PM on this device"
                : "On — reminders work on the Android app"
              : "Off — enable to get nudges to study"}
          </p>
        </div>
        <button
          type="button"
          className={`toggle ${user.notifications ? "on" : ""}`}
          onClick={() => void toggleNotifications()}
          aria-label="Toggle study reminders"
        />
      </div>

      <div className="notifications-list">
        {items.length === 0 ? (
          <p className="soft notifications-empty">No messages yet. Finish a focus session or check back after announcements.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className={`notification-item notification-${item.kind}`}>
              {item.kind === "announcement" && <Megaphone size={16} />}
              {item.kind === "event" && <Zap size={16} />}
              {item.kind === "milestone" && <Sparkles size={16} />}
              {item.kind === "inbox" && <Bell size={16} />}
              <div>
                <b>{item.title}</b>
                <p className="soft">{item.body}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="row wrap modal-actions">
        {user.inbox.length > 0 && (
          <PressableButton variant="ghost" onClick={clearInbox}>
            Clear inbox
          </PressableButton>
        )}
        <PressableButton onClick={onClose}>Done</PressableButton>
      </div>
    </Modal>
  );
}
