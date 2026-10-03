import { Bell, Megaphone, Sparkles, X, Zap } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { buildNotificationItems, visibleNotificationItems } from "../../lib/notification-items";
import { ensureExactAlarmPermission, getNotificationService, syncNotificationSchedule } from "../../lib/notifications";
import { formatReminderTime } from "../../lib/reminder-time";
import { isAndroid, isNative } from "../../lib/native";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

export function NotificationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, store, updateUser, setToast } = useStudyGrind();
  if (!user) return null;

  const reminderHour = user.reminderHour ?? 17;
  const reminderMinute = user.reminderMinute ?? 0;
  const dismissed = new Set(user.dismissedNotifications ?? []);
  const items = visibleNotificationItems(user, store);

  const dismiss = (id: string) => {
    if (dismissed.has(id)) return;
    updateUser({ ...user, dismissedNotifications: [...(user.dismissedNotifications ?? []), id] });
  };

  const clearAll = () => {
    const allIds = buildNotificationItems(user, store).map((i) => i.id);
    updateUser({
      ...user,
      inbox: [],
      dismissedNotifications: Array.from(new Set([...(user.dismissedNotifications ?? []), ...allIds])),
    });
    setToast("All notifications cleared");
  };

  const toggleNotifications = async () => {
    const next = !user.notifications;
    if (next && isNative) {
      const svc = await getNotificationService();
      if (svc.isSupported()) {
        const perm = await svc.requestPermission();
        if (perm !== "granted") {
          setToast("Notification permission denied.");
          return;
        }
      }
      if (isAndroid) await ensureExactAlarmPermission();
    }
    updateUser({ ...user, notifications: next, notificationPref: next });
    await syncNotificationSchedule(next, reminderHour, reminderMinute);
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
            <Bell size={14} /> Daily study reminders (optional)
          </b>
          <p className="soft">
            {user.notifications
              ? isNative
                ? `On — ${formatReminderTime(reminderHour, reminderMinute)} London time (GMT/BST)`
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
              <div className="notification-item-body">
                <b>{item.title}</b>
                <p className="soft">{item.body}</p>
              </div>
              <button type="button" className="ghost icon-btn" aria-label="Dismiss" onClick={() => dismiss(item.id)}>
                <X size={16} />
              </button>
            </article>
          ))
        )}
      </div>

      <div className="row wrap modal-actions">
        {items.length > 0 && (
          <PressableButton variant="ghost" onClick={clearAll}>
            Clear all
          </PressableButton>
        )}
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
