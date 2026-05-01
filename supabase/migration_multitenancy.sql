-- ─────────────────────────────────────────────
-- Multi-tenancy migration
-- Store owners, private catalogs, demo products
-- ─────────────────────────────────────────────

-- 1. Store profiles (one per owner account)
create table if not exists store_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  store_name  text not null,
  website_url text,
  role        text not null default 'owner' check (role in ('owner', 'superadmin')),
  created_at  timestamptz not null default now()
);

alter table store_profiles enable row level security;

-- Owners can read/update their own profile
create policy "owner_read_own_profile"
  on store_profiles for select
  using (auth.uid() = id);

create policy "owner_update_own_profile"
  on store_profiles for update
  using (auth.uid() = id);

-- 2. Store products (private catalog per store)
create table if not exists store_products (
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

-- Owners can do everything with their own products
create policy "owner_manage_own_products"
  on store_products for all
  using (store_id = auth.uid());

-- 3. Demo products (platform-wide, managed by superadmin)
create table if not exists demo_products (
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

-- Anyone can read visible demo products (for visitor catalog)
create policy "public_read_demo_products"
  on demo_products for select
  using (visible = true);

-- Only superadmin can manage demo products
create policy "superadmin_manage_demo_products"
  on demo_products for all
  using (
    exists (
      select 1 from store_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- 4. Updated_at trigger helper
create or replace function update_updated_at()
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

-- 5. Give existing sessions/leads/boards a store_id column
--    (nullable for backward-compat, will be set for new sessions)
alter table sessions   add column if not exists store_id uuid references store_profiles(id);
alter table leads      add column if not exists store_id uuid references store_profiles(id);
alter table boards     add column if not exists store_id uuid references store_profiles(id);
