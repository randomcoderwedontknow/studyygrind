# Study reminders (Android)

Web uses [`web-stub.ts`](web-stub.ts) — no OS notifications.

## Android implementation

| Layer | Role |
|-------|------|
| [`android.ts`](android.ts) | Capacitor Local Notifications — daily 5:00 PM **America/New_York**, channel `study-reminders-v2`, id `9001`, tap extra `route: timer` |
| [`index.ts`](index.ts) | `syncNotificationSchedule()` — Capacitor schedule + native prefs bridge |
| [`../notification-prefs.ts`](../notification-prefs.ts) | JS bridge to `NotificationPrefs` Capacitor plugin |
| `DailyReminderScheduler.java` | **Boot backup** — AlarmManager one-shot chain until app reopens |
| `BootReceiver.java` | Widget refresh + schedule native backup if reminders enabled |
| `ReminderAlarmReceiver.java` | Posts notification with `studygrind://timer` deep link |

## Flow

1. User enables reminders in Settings → `POST_NOTIFICATIONS` + exact-alarm prompt (API 31+) → Capacitor schedule.
2. JS writes `notifications_enabled` via `NotificationPrefsBridge` and cancels native AlarmManager (avoids duplicates while app has run).
3. After reboot, `BootReceiver` schedules native backup if flag is still true.
4. On next app open/resume, `syncNotificationSchedule(true)` restores Capacitor scheduling.
5. Tapping a reminder opens the **Timer** tab via `localNotificationActionPerformed` listener in `StudyGrindContext`.

## Icon

Status-bar icon: `android/app/src/main/res/drawable/ic_stat_studygrind.xml` (white monochrome book + clock).
