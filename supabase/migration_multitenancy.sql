-- ─────────────────────────────────────────────
-- Multi-tenancy migration (clean slate)
-- Drop & recreate all tables
-- ─────────────────────────────────────────────

-- Drop existing objects in reverse dependency order
drop table if exists store_settings  cascade;
drop table if exists store_products  cascade;
drop table if exists demo_products   cascade;
drop table if exists store_profiles  cascade;
drop function if exists update_updated_at cascade;

-- 1. Store profiles (one per owner account)
create table store_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  store_name  text not null,
  website_url text,
  role        text not null default 'owner' check (role in ('owner', 'superadmin')),
  created_at  timestamptz not null default now()
);

alter table store_profiles enable row level security;

create policy "owner_read_own_profile"
  on store_profiles for select
  using (auth.uid() = id);

create policy "owner_update_own_profile"
  on store_profiles for update
  using (auth.uid() = id);

-- 2. Store products (private catalog per store)
create table store_products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references store_profiles(id) on delete cascade,
  name        text not null,
  maker       text not null default '',
  price       text not null default '',
  category    text not null default 'Other',
  src         text not null default '',
  colors      text[] default '{}',
  role        text default 'ground',
  details     jsonb default '{}',
  gallery     text[] default '{}',
  visible     boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table store_products enable row level security;

create policy "owner_manage_own_products"
  on store_products for all
  using (store_id = auth.uid());

-- 3. Demo products (platform-wide, visitor catalog)
create table demo_products (
  id          text primary key,
  name        text not null,
  maker       text not null default '',
  price       text not null default '',
  category    text not null default 'Other',
  src         text not null default '',
  colors      text[] default '{}',
  role        text default 'ground',
  details     jsonb default '{}',
  gallery     text[] default '{}',
  visible     boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table demo_products enable row level security;

create policy "public_read_demo_products"
  on demo_products for select
  using (visible = true);

create policy "superadmin_manage_demo_products"
  on demo_products for all
  using (
    exists (
      select 1 from store_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- 4. Updated_at trigger
create function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger store_products_updated_at
  before update on store_products
  for each row execute function update_updated_at();

create trigger demo_products_updated_at
  before update on demo_products
  for each row execute function update_updated_at();

-- 5. Store settings (per-store key/value config)
create table store_settings (
  store_id   uuid not null references store_profiles(id) on delete cascade,
  key        text not null,
  value      text,
  primary key (store_id, key)
);

alter table store_settings enable row level security;

create policy "owner_manage_own_settings"
  on store_settings for all
  using (store_id = auth.uid());
