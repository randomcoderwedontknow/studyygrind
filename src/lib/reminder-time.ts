/** Format hour/minute for reminder UI labels (24h input → 12h display). */
export function formatReminderTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export const REMINDER_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: formatReminderTime(hour, 0),
}));
