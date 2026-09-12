-- Extend the profiles table with curated columns and an extras JSONB blob.
-- Run this once in the Supabase SQL editor before reloading the app.

alter table public.profiles
  add column if not exists tasks_completed int default 0,
  add column if not exists sessions_completed int default 0,
  add column if not exists banned boolean default false,
  add column if not exists suspended_until timestamptz,
  add column if not exists muted boolean default false,
  add column if not exists tagline text default '',
  add column if not exists custom_rank_name text default '',
  add column if not exists equipped_theme text default 'green',
  add column if not exists discount int default 0,
  add column if not exists streak_shields int default 0,
  add column if not exists role_expires_at timestamptz,
  add column if not exists vip_expires_at timestamptz,
  add column if not exists honorary_expires_at timestamptz,
  add column if not exists last_study_date text default '',
  add column if not exists extras jsonb default '{}'::jsonb;

-- Existing RLS policies still apply: each user can only upsert their own row.
