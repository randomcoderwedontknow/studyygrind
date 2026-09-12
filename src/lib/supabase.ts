import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://pcsmpwfemwhtljsnviml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_gW_AUKrrTv10_qm4W1Vc9Q_4Mr2w7b6";

const supabaseStorage: Storage | undefined =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined"
    ? window.localStorage
    : undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "implicit",
    storageKey: "studygrind_supabase_auth",
    storage: supabaseStorage,
  },
  global: {
    headers: { "x-studygrind-client": "capacitor-android" },
  },
});

export const OWNER_SUPA_EMAIL = "abdullahahmed@studygrind.app";
export const OWNER_SUPA_PASSWORD = "owner-studygrind-2026!";

export type SyncResult = { ok: boolean; created: boolean; message: string };

export async function ensureSupabaseUser(
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
): Promise<SyncResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      const msg = error.message || "";
      if (/already|registered|exists/i.test(msg)) {
        return { ok: true, created: false, message: "already-registered" };
      }
      return { ok: false, created: false, message: msg };
    }
    return { ok: true, created: Boolean(data.user), message: "created" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "supabase unreachable";
    return { ok: false, created: false, message: msg };
  }
}

/**
 * Minimal shape required for upserting a profile. App.tsx's `UserData` is a
 * superset of this — declared loose here so we don't create a circular import.
 */
export type ProfileUpsertInput = {
  username: string;
  role: string;
  focusPoints: number;
  totalStudyMinutes: number;
  sessionsCompleted: number;
  tasksCompleted: number;
  streak: number;
  vipAccess: boolean;
  honoraryAccess: boolean;
  banned: boolean;
  suspendedUntil: string;
  muted: boolean;
  tagline: string;
  customRankName: string;
  equippedTheme: string;
  discount: number;
  streakShields: number;
  roleExpiresAt: string;
  vipExpiresAt: string;
  honoraryExpiresAt: string;
  lastStudyDate: string;
  [key: string]: unknown;
};

const CURATED_KEYS = new Set([
  "username",
  "role",
  "focusPoints",
  "totalStudyMinutes",
  "sessionsCompleted",
  "tasksCompleted",
  "streak",
  "vipAccess",
  "honoraryAccess",
  "banned",
  "suspendedUntil",
  "muted",
  "tagline",
  "customRankName",
  "equippedTheme",
  "discount",
  "streakShields",
  "roleExpiresAt",
  "vipExpiresAt",
  "honoraryExpiresAt",
  "lastStudyDate",
  "supabaseId",
  "email",
  "password",
]);

export type UpsertResult = { ok: boolean; message: string };

export async function upsertProfile(
  supabaseId: string,
  u: ProfileUpsertInput,
): Promise<UpsertResult> {
  if (!supabaseId) return { ok: false, message: "no-session" };
  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(u)) {
    if (!CURATED_KEYS.has(k)) extras[k] = v;
  }
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: supabaseId,
        username: u.username,
        role: u.role,
        focus_points: u.focusPoints,
        total_study_minutes: u.totalStudyMinutes,
        sessions_completed: u.sessionsCompleted,
        tasks_completed: u.tasksCompleted,
        streak: u.streak,
        vip_access: u.vipAccess,
        honorary_access: u.honoraryAccess,
        banned: u.banned,
        suspended_until: u.suspendedUntil || null,
        muted: u.muted,
        tagline: u.tagline,
        custom_rank_name: u.customRankName,
        equipped_theme: u.equippedTheme,
        discount: u.discount,
        streak_shields: u.streakShields,
        role_expires_at: u.roleExpiresAt || null,
        vip_expires_at: u.vipExpiresAt || null,
        honorary_expires_at: u.honoraryExpiresAt || null,
        last_study_date: u.lastStudyDate,
        extras,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "synced" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "supabase unreachable";
    return { ok: false, message: msg };
  }
}
