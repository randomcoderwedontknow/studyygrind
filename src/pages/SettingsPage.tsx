import { useRef } from "react";
import { Accessibility, Bell, Database, Lock, LogOut, Moon, Palette, RotateCcw, Share2, ShieldCheck, Vibrate, Volume2 } from "lucide-react";
import { Share } from "@capacitor/share";
import { useStudyGrind } from "../context/StudyGrindContext";
import { STUDYGRIND_APK_DOWNLOAD_URL } from "../data/constants";
import { ensureExactAlarmPermission, getNotificationService, syncNotificationSchedule } from "../lib/notifications";
import { isAndroid, isNative } from "../lib/native";
import { hapticLight, hapticMedium } from "../lib/haptics";
import { formatReminderTime, REMINDER_HOUR_OPTIONS } from "../lib/reminder-time";
import { ACCENT_AUTO_ID, ACCENT_PRESETS, ACCENT_THEME_ID, autoAccentForHour } from "../data/accent-presets";
import { themeAppearance } from "../data/themes";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { downloadBackup, readBackupFile } from "../lib/backup";

function Row({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="list-row">
      <div className="settings-row-main">
        <span className="settings-icon">{icon}</span>
        <div>
          <span>{label}</span>
          {hint && <small className="soft block">{hint}</small>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => {
        hapticLight();
        onClick();
      }}
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
    >
      <span />
    </button>
  );
}

function AccentSwatch({
  id,
  name,
  primary,
  primary2,
  hint,
  active,
  onPick,
}: {
  id: string;
  name: string;
  primary: string;
  primary2: string;
  hint?: string;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={`accent-swatch ${active ? "active" : ""}`}
      data-accent-id={id}
      onClick={() => {
        hapticLight();
        onPick();
      }}
    >
      <span className="accent-dot" style={{ background: `linear-gradient(135deg, ${primary}, ${primary2})` }} aria-hidden="true" />
      <span className="accent-name">{name}</span>
      {hint && <small className="soft">{hint}</small>}
    </button>
  );
}

export function SettingsPage() {
  const { user, updateUser, setStore, setToast, goTab, store } = useStudyGrind();
  const importRef = useRef<HTMLInputElement>(null);
  if (!user) return null;

  const isOwner = user.role === "owner";
  const themeLook = themeAppearance(user.equippedTheme, store.customThemes, user.savedCustomThemes);
  const autoLook = autoAccentForHour(new Date().getHours());
  const reminderHour = user.reminderHour ?? 17;
  const reminderMinute = user.reminderMinute ?? 0;

  const enableReminders = async () => {
    if (isNative) {
      const svc = await getNotificationService();
      const perm = await svc.requestPermission();
      if (perm !== "granted") {
        setToast("Notification permission denied.");
        return false;
      }
      if (isAndroid) {
        const exact = await ensureExactAlarmPermission();
        if (!exact) {
          setToast("Exact alarm permission denied — reminders may be delayed on this device.");
        }
      }
    }
    return true;
  };

  const scheduleReminders = async (enabled: boolean, hour = reminderHour, minute = reminderMinute) => {
    await syncNotificationSchedule(enabled, hour, minute);
  };

  const inviteFriends = async () => {
    const url = STUDYGRIND_APK_DOWNLOAD_URL;
    const text = `Join me on StudyGrind — focus, tasks, flashcards and study streaks.\nDownload: ${url}`;
    try {
      if (isNative) {
        await Share.share({ title: "StudyGrind", text, url, dialogTitle: "Share StudyGrind" });
      } else if (navigator.share) {
        await navigator.share({ title: "StudyGrind", text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setToast("Invite message copied.");
      }
    } catch {
      /* user cancelled share sheet */
    }
  };

  return (
    <PageTransition stagger>
      <section className="card">
        <h4>Appearance & sound</h4>
        <div className="list">
          <Row icon={<Moon size={18} />} label="Dark mode">
            <Toggle on={user.darkMode} label="Toggle dark mode" onClick={() => updateUser({ ...user, darkMode: !user.darkMode })} />
          </Row>
          <Row icon={<Volume2 size={18} />} label="Sound effects">
            <Toggle on={user.soundEffects} label="Toggle sound effects" onClick={() => updateUser({ ...user, soundEffects: !user.soundEffects })} />
          </Row>
          {isAndroid ? (
            <Row icon={<Vibrate size={18} />} label="Haptic feedback" hint="Subtle taps on navigation, timer and rewards">
              <Toggle
                on={user.hapticsEnabled}
                label="Toggle haptic feedback"
                onClick={() => {
                  const next = !user.hapticsEnabled;
                  updateUser({ ...user, hapticsEnabled: next });
                  if (next) window.setTimeout(hapticMedium, 60);
                }}
              />
            </Row>
          ) : (
            <Row icon={<Vibrate size={18} />} label="Haptic feedback" hint="Available in the Android app">
              <Toggle on={user.hapticsEnabled} label="Haptic feedback (Android only)" onClick={() => {}} disabled />
            </Row>
          )}
        </div>
      </section>

      <section className="card accent-card">
        <h4>
          <Palette size={16} /> Dynamic accent
        </h4>
        <p className="soft">Tint buttons, chips and highlights with a wallpaper-style tone — independent of your equipped theme.</p>
        <div className="accent-grid" role="radiogroup" aria-label="Dynamic accent">
          <AccentSwatch
            id={ACCENT_THEME_ID}
            name="Theme"
            primary={themeLook.color}
            primary2={themeLook.color2 ?? themeLook.color}
            hint="equipped"
            active={user.accentPreset === ACCENT_THEME_ID}
            onPick={() => updateUser({ ...user, accentPreset: ACCENT_THEME_ID })}
          />
          <AccentSwatch
            id={ACCENT_AUTO_ID}
            name="Auto"
            primary={autoLook.primary}
            primary2={autoLook.primary2}
            hint="time of day"
            active={user.accentPreset === ACCENT_AUTO_ID}
            onPick={() => updateUser({ ...user, accentPreset: ACCENT_AUTO_ID })}
          />
          {ACCENT_PRESETS.map((p) => (
            <AccentSwatch
              key={p.id}
              id={p.id}
              name={p.name}
              primary={p.primary}
              primary2={p.primary2}
              active={user.accentPreset === p.id}
              onPick={() => updateUser({ ...user, accentPreset: p.id })}
            />
          ))}
        </div>
        <small className="soft block accent-note">
          {user.accentPreset === ACCENT_THEME_ID
            ? "Following your equipped theme."
            : user.accentPreset === ACCENT_AUTO_ID
              ? `${autoLook.name} — shifts warm to cool through the day.`
              : `${ACCENT_PRESETS.find((p) => p.id === user.accentPreset)?.name ?? "Custom"} accent active.`}
        </small>
      </section>

      <section className="card">
        <h4>Focus</h4>
        <div className="list">
          <Row
            icon={<Bell size={18} />}
            label="Daily study reminders (optional)"
            hint={
              isNative
                ? user.notifications
                  ? `On — ${formatReminderTime(reminderHour, reminderMinute)} London time (GMT/BST)`
                  : "Off by default — turn on to get a daily nudge"
                : "Web stores the preference — real reminders on the Android app"
            }
          >
            <Toggle
              on={user.notifications}
              label="Toggle study reminders"
              onClick={async () => {
                const next = !user.notifications;
                if (next && !(await enableReminders())) return;
                updateUser({ ...user, notifications: next, notificationPref: next });
                await scheduleReminders(next);
                setToast(
                  next
                    ? isNative
                      ? `Daily reminder scheduled for ${formatReminderTime(reminderHour, reminderMinute)} London time.`
                      : "Preference saved for Android install."
                    : "Reminders off.",
                );
              }}
            />
          </Row>
          {user.notifications && (
            <Row
              icon={<Bell size={18} />}
              label="Reminder time"
              hint="London time (GMT/BST)"
            >
              <select
                className="input compact"
                aria-label="Reminder hour"
                value={reminderHour}
                onChange={async (e) => {
                  const hour = Number(e.target.value);
                  const next = { ...user, reminderHour: hour, reminderMinute: 0 };
                  updateUser(next);
                  if (user.notifications) {
                    await scheduleReminders(true, hour, 0);
                    setToast(`Reminder set for ${formatReminderTime(hour, 0)} London time.`);
                  }
                }}
              >
                {REMINDER_HOUR_OPTIONS.map(({ hour, label }) => (
                  <option key={hour} value={hour}>
                    {label}
                  </option>
                ))}
              </select>
            </Row>
          )}
          <Row icon={<Lock size={18} />} label="Focus lock" hint="Block chosen tabs while a session runs">
            <Toggle on={user.focusLockOn} label="Toggle focus lock" onClick={() => updateUser({ ...user, focusLockOn: !user.focusLockOn })} />
          </Row>
        </div>
      </section>

      <section className="card">
        <h4>Accessibility</h4>
        <p className="soft">Motion, text size, contrast, touch targets, and haptics.</p>
        <PressableButton onClick={() => goTab("accessibility")}>
          <Accessibility size={16} /> Open accessibility
        </PressableButton>
      </section>

      <section className="card">
        <h4>
          <Database size={16} /> Data
        </h4>
        <p className="soft">Export or restore your local StudyGrind progress on this device.</p>
        <div className="row wrap">
          <PressableButton
            onClick={() => {
              downloadBackup(store);
              setToast("Backup downloaded.");
            }}
          >
            Export backup
          </PressableButton>
          <PressableButton variant="ghost" onClick={() => importRef.current?.click()}>
            Import backup
          </PressableButton>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (!window.confirm("Import replaces all local progress on this device. Continue?")) return;
              try {
                const payload = await readBackupFile(file);
                setStore({ ...payload.store, current: user.email });
                setToast("Backup restored.");
              } catch {
                setToast("Could not import backup.");
              }
            }}
          />
        </div>
      </section>

      <section className="card">
        <h4>Share</h4>
        <p className="soft">Invite cousins and friends to StudyGrind via WhatsApp, Messages, or any app.</p>
        <PressableButton onClick={() => void inviteFriends()}>
          <Share2 size={16} /> Invite friends
        </PressableButton>
      </section>

      {isOwner && (
        <section className="card owner-entry-card">
          <div>
            <h4>
              <ShieldCheck size={16} /> Owner Settings
            </h4>
            <p className="soft">Users, roles, global themes, broadcasts, moderation, maintenance and system tools.</p>
          </div>
          <PressableButton onClick={() => goTab("ownerSettings")}>Open Owner Settings</PressableButton>
        </section>
      )}

      <section className="card">
        <h4>Account</h4>
        <div className="row wrap">
          <PressableButton
            variant="ghost"
            onClick={() => {
              setStore((p) => ({ ...p, seenOnboarding: false, onboardingStep: 0 }));
              setToast("Onboarding will show on next visit.");
            }}
          >
            <RotateCcw size={16} /> Replay onboarding
          </PressableButton>
          <PressableButton
            variant="ghost"
            onClick={() => {
              setStore((p) => ({ ...p, current: "" }));
              setToast("Signed out.");
            }}
          >
            <LogOut size={16} /> Sign out
          </PressableButton>
        </div>
        <p className="soft" style={{ marginTop: 12 }}>
          Signed in as <b>{user.username}</b>
          {user.role !== "user" ? ` · ${user.role}` : ""}
        </p>
        <p className="soft settings-version">StudyGrind v12.0.0</p>
      </section>
    </PageTransition>
  );
}
