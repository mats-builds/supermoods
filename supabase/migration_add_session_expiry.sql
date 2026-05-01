-- Migration: session expiry + store settings
-- Run in Supabase SQL Editor

-- 1. Add expires_at to sessions so the owner can control how long a customer link stays active
alter table sessions add column if not exists expires_at timestamptz;

-- 2. Store-level settings (e.g. link_duration_days)
create table if not exists store_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table store_settings enable row level security;
create policy "allow_all_settings" on store_settings for all using (true) with check (true);

-- Default: links expire after 14 days
insert into store_settings (key, value) values ('link_duration_days', '14')
  on conflict (key) do nothing;
