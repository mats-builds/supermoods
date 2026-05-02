-- Fix store_products FK: reference auth.users directly instead of store_profiles
-- This allows product management without requiring a store_profile record first
ALTER TABLE store_products
  DROP CONSTRAINT store_products_store_id_fkey;

ALTER TABLE store_products
  ADD CONSTRAINT store_products_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Public (unauthenticated) read for visible products
CREATE POLICY "public_read_visible_products"
  ON store_products FOR SELECT
  USING (visible = true);
