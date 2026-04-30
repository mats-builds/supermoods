-- ============================================================
-- Supermoods — User Account Migration
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- 1. User board state (current working board, 1 row per user)
CREATE TABLE IF NOT EXISTS user_boards (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  product_ids text[]      NOT NULL DEFAULT '{}',
  palette_id  text,
  scene_id    text,
  layout      jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_board" ON user_boards
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. User imported products (URL-added pieces, 1 row per user)
CREATE TABLE IF NOT EXISTS user_products (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  products   jsonb       NOT NULL DEFAULT '[]',
  hidden_ids text[]      NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_products" ON user_products
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Link existing leads table to auth users (safe: only adds column if missing)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lead lookups by user
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);

-- RLS on leads (owners can read all; users see only their own)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Store owners (service role key bypasses RLS; this policy is for anon/user reads)
CREATE POLICY "users_see_own_leads" ON leads
  FOR SELECT
  USING (auth.uid() = user_id);
