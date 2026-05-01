-- Add store_id to store_settings for multi-tenancy
-- Drop the old single-key primary key and replace with (store_id, key) composite

alter table store_settings add column if not exists store_id uuid references store_profiles(id) on delete cascade;

-- Drop old unique constraint and add composite one
alter table store_settings drop constraint if exists store_settings_pkey;
alter table store_settings add primary key (store_id, key);

-- Drop the permissive policy and replace with owner-scoped one
drop policy if exists "allow_all_settings" on store_settings;

create policy "owner_manage_own_settings"
  on store_settings for all
  using (store_id = auth.uid());
