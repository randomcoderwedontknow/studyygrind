import type { Task, TaskRecurrence } from "../types";
import { dayDiff, todayKey, normalizeDateKey } from "./dates";

export function normalizeRecurrence(r?: TaskRecurrence): TaskRecurrence {
  if (!r || r.kind === "none") return { kind: "none" };
  if (r.kind === "daily") return { kind: "daily", until: r.until, startDate: r.startDate };
  const dates = [...new Set((r.dates ?? []).map(normalizeDateKey).filter(Boolean))].sort();
  return { kind: "dates", dates };
}

export function isRecurringTask(task: Task): boolean {
  const r = task.recurrence;
  return Boolean(r && r.kind !== "none");
}

function enumerateDays(start: string, until: string): string[] {
  const out: string[] = [];
  let d = start;
  let guard = 0;
  while (d <= until && guard < 3660) {
    out.push(d);
    const next = new Date(`${d}T12:00:00`);
    next.setDate(next.getDate() + 1);
    d = next.toISOString().slice(0, 10);
    guard++;
  }
  return out;
}

export function scheduledOccurrenceDates(task: Task): string[] {
  const r = normalizeRecurrence(task.recurrence);
  if (r.kind === "none") return [];
  if (r.kind === "dates") return r.dates;
  const start = r.startDate ?? task.recurrenceStartDate ?? task.dueDate ?? todayKey();
  if (!r.until) return [];
  if (r.until < start) return [];
  return enumerateDays(start, r.until);
}

export function completedOccurrences(task: Task): string[] {
  return [...new Set((task.completedOccurrenceDates ?? []).map(normalizeDateKey).filter(Boolean))];
}

export function isOccurrenceComplete(task: Task, day: string): boolean {
  return completedOccurrences(task).includes(day);
}

export function isRecurrenceComplete(task: Task): boolean {
  const r = normalizeRecurrence(task.recurrence);
  if (r.kind === "none") return true;
  const required = scheduledOccurrenceDates(task);
  if (r.kind === "daily" && !r.until) return false;
  if (required.length === 0) return false;
  const done = completedOccurrences(task);
  return required.every((d) => done.includes(d));
}

export function nextIncompleteOccurrence(task: Task, today = todayKey()): string | null {
  const r = normalizeRecurrence(task.recurrence);
  if (r.kind === "none") return null;
  const done = completedOccurrences(task);
  if (r.kind === "daily" && !r.until) {
    if (!done.includes(today)) return today;
    return null;
  }
  const required = scheduledOccurrenceDates(task);
  return required.find((d) => !done.includes(d)) ?? null;
}

export function recurrenceProgressLabel(task: Task): string | null {
  const r = normalizeRecurrence(task.recurrence);
  if (r.kind === "none") return null;
  const done = completedOccurrences(task).length;
  if (r.kind === "daily" && !r.until) {
    const today = todayKey();
    return completedOccurrences(task).includes(today) ? "Done today" : "Due today";
  }
  const total = scheduledOccurrenceDates(task).length;
  if (total === 0) return "Set end date";
  return `${done}/${total} days`;
}

export function daysUntilExamLabel(examDate: string): string {
  const d = dayDiff(examDate);
  if (d > 0) return `${d}d ago`;
  if (d === 0) return "Today";
  return `${-d}d left`;
}
