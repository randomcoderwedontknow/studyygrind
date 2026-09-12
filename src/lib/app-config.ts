import { supabase } from "./supabase";

/**
 * Cross-device app config stored in Supabase.
 *
 * Table (run once in the Supabase SQL editor):
 *
 *   create table if not exists public.app_config (
 *     key text primary key,
 *     value jsonb not null default '{}'::jsonb,
 *     updated_at timestamptz not null default now()
 *   );
 *   alter table public.app_config enable row level security;
 *   create policy "app_config read" on public.app_config for select using (true);
 *   create policy "app_config owner write" on public.app_config
 *     for all to authenticated
 *     using (auth.jwt() ->> 'email' = 'abdullahahmed@studygrind.app')
 *     with check (auth.jwt() ->> 'email' = 'abdullahahmed@studygrind.app');
 *   alter publication supabase_realtime add table public.app_config;
 *   insert into public.app_config (key, value)
 *     values ('maintenance', '{"on": false, "message": ""}'::jsonb)
 *     on conflict (key) do nothing;
 */

export type MaintenanceConfig = {
  on: boolean;
  message: string;
  updatedAt: string;
};

export type AppConfig = {
  maintenance: MaintenanceConfig;
};

const MAINTENANCE_KEY = "maintenance";
const CACHE_KEY = "studygrind_app_config_cache";
const POLL_MS = 60_000;

export const DEFAULT_APP_CONFIG: AppConfig = {
  maintenance: { on: false, message: "", updatedAt: "" },
};

type RawRow = { key: string; value: unknown; updated_at?: string };

function parseMaintenance(row: RawRow | null | undefined): MaintenanceConfig {
  if (!row || typeof row.value !== "object" || row.value === null) return DEFAULT_APP_CONFIG.maintenance;
  const v = row.value as Record<string, unknown>;
  return {
    on: Boolean(v.on),
    message: typeof v.message === "string" ? v.message : "",
    updatedAt: row.updated_at ?? "",
  };
}

export function readCachedAppConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return { maintenance: { ...DEFAULT_APP_CONFIG.maintenance, ...(parsed.maintenance ?? {}) } };
  } catch {
    return null;
  }
}

function writeCache(cfg: AppConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore quota */
  }
}

export type FetchResult = { ok: boolean; config: AppConfig; message: string };

export async function fetchAppConfig(): Promise<FetchResult> {
  try {
    const { data, error } = await supabase.from("app_config").select("key,value,updated_at").eq("key", MAINTENANCE_KEY).maybeSingle();
    if (error) {
      // Table missing (42P01) or RLS denied — fall back to cache.
      return { ok: false, config: readCachedAppConfig() ?? DEFAULT_APP_CONFIG, message: error.message };
    }
    const cfg: AppConfig = { maintenance: parseMaintenance(data as RawRow | null) };
    writeCache(cfg);
    return { ok: true, config: cfg, message: "ok" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unreachable";
    return { ok: false, config: readCachedAppConfig() ?? DEFAULT_APP_CONFIG, message: msg };
  }
}

export async function setRemoteMaintenanceMode(on: boolean, message = ""): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("app_config")
      .upsert({ key: MAINTENANCE_KEY, value: { on, message }, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return { ok: false, message: error.message };
    writeCache({ maintenance: { on, message, updatedAt: new Date().toISOString() } });
    return { ok: true, message: "ok" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "unreachable" };
  }
}

/**
 * Subscribe to config changes: realtime channel + 60s poll + refetch when the
 * app returns to the foreground. Returns an unsubscribe function.
 */
export function subscribeAppConfig(onChange: (cfg: AppConfig, fromRemote: boolean) => void): () => void {
  let stopped = false;

  const cached = readCachedAppConfig();
  if (cached) onChange(cached, false);

  const refresh = async () => {
    if (stopped) return;
    const res = await fetchAppConfig();
    if (stopped) return;
    if (res.ok) onChange(res.config, true);
  };

  void refresh();

  const channel = supabase
    .channel("app_config_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_config" }, (payload) => {
      const row = (payload.new ?? null) as RawRow | null;
      if (!row || row.key !== MAINTENANCE_KEY) return;
      const cfg: AppConfig = { maintenance: parseMaintenance(row) };
      writeCache(cfg);
      onChange(cfg, true);
    })
    .subscribe();

  const poll = window.setInterval(() => void refresh(), POLL_MS);
  const onVisible = () => {
    if (document.visibilityState === "visible") void refresh();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onVisible);

  return () => {
    stopped = true;
    window.clearInterval(poll);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onVisible);
    void supabase.removeChannel(channel);
  };
}
