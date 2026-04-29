-- Supermoods schema + seed data
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

create extension if not exists "uuid-ossp";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('SEATING','TABLES','LIGHTING','STORAGE','DECOR','TEXTILES','ART')),
  price numeric(10,2) not null,
  description text,
  maker text,
  images text[] default '{}',
  specs jsonb default '{}',
  visible boolean default true,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  magic_link_token text unique default encode(gen_random_bytes(32), 'hex'),
  store_id text default 'default',
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table if not exists boards (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  canvas_state jsonb default '{"items":[]}',
  backdrop text default 'none',
  palette text default 'none',
  total_value numeric(10,2) default 0,
  updated_at timestamptz default now()
);

create table if not exists board_items (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade,
  product_id uuid references products(id),
  scale numeric(4,2) default 1.0,
  position_x numeric(8,2) default 0,
  position_y numeric(8,2) default 0
);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ─── Row-level security ───────────────────────────────────────────────────────

alter table products    enable row level security;
alter table sessions    enable row level security;
alter table boards      enable row level security;
alter table board_items enable row level security;
alter table leads       enable row level security;
alter table events      enable row level security;

create policy "public_read_products"   on products    for select using (visible = true);
create policy "allow_all_sessions"     on sessions    for all using (true) with check (true);
create policy "allow_all_boards"       on boards      for all using (true) with check (true);
create policy "allow_all_board_items"  on board_items for all using (true) with check (true);
create policy "allow_all_leads"        on leads       for all using (true) with check (true);
create policy "allow_all_events"       on events      for all using (true) with check (true);

-- ─── Seed data (10 products) ──────────────────────────────────────────────────

insert into products (id, name, category, price, description, maker, images, specs) values

('00000000-0000-0000-0000-000000000001',
 'Alto Lounge Chair', 'SEATING', 3200,
 'A masterclass in understated luxury. Sculpted in solid oak with hand-stitched full-grain leather, the Alto wraps you in warmth without announcing itself.',
 'Atelier Nordico',
 array['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'],
 '{"Width":"76 cm","Depth":"80 cm","Height":"84 cm","Material":"Oak, Full-grain leather","Weight":"18 kg"}'::jsonb),

('00000000-0000-0000-0000-000000000002',
 'Forma Sofa', 'SEATING', 6800,
 'Clean lines, generous proportions. The Forma sofa is upholstered in Belgian linen with a solid ash frame — built to become the room''s quiet anchor.',
 'Studio Leem',
 array['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80','https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80'],
 '{"Width":"240 cm","Depth":"95 cm","Height":"78 cm","Material":"Ash, Belgian linen","Weight":"52 kg"}'::jsonb),

('00000000-0000-0000-0000-000000000003',
 'Mesa Dining Table', 'TABLES', 4500,
 'Hewn from a single slab of American walnut, each Mesa table is entirely one-of-a-kind. The live edge speaks to the wood''s origin; the steel base grounds it in the present.',
 'Blackcreek Mercantile',
 array['https://images.unsplash.com/photo-1549497538-303791108f95?w=800&q=80','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'],
 '{"Width":"200 cm","Depth":"90 cm","Height":"75 cm","Material":"American walnut, Steel","Seats":"8"}'::jsonb),

('00000000-0000-0000-0000-000000000004',
 'Bec Side Table', 'TABLES', 780,
 'Three legs, one story. The Bec is turned from marble offcuts, giving each piece its own veining. Small enough to tuck anywhere, beautiful enough to be the point.',
 'Hem',
 array['https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80'],
 '{"Diameter":"35 cm","Height":"48 cm","Material":"Marble","Weight":"6 kg"}'::jsonb),

('00000000-0000-0000-0000-000000000005',
 'Arco Floor Lamp', 'LIGHTING', 1200,
 'An arc of brushed brass suspends a frosted globe above any scene. The Arco casts a warm, diffuse light that flatters both rooms and the people in them.',
 'Ferm Living',
 array['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'],
 '{"Height":"185 cm","Arm span":"120 cm","Material":"Brass, Glass","Bulb":"E27, max 40W"}'::jsonb),

('00000000-0000-0000-0000-000000000006',
 'Tora Pendant', 'LIGHTING', 890,
 'Hand-folded from a single sheet of patinated steel, the Tora pendant is both shade and sculpture. The aged finish deepens over time.',
 'Menu',
 array['https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80'],
 '{"Diameter":"42 cm","Height":"30 cm","Material":"Patinated steel","Cord":"3 m textile cord"}'::jsonb),

('00000000-0000-0000-0000-000000000007',
 'Oki Bookshelf', 'STORAGE', 2100,
 'Modular, ash-veneered shelving with an open lattice that''s as much room divider as storage. Configure it how you like — it adapts.',
 'Muuto',
 array['https://images.unsplash.com/photo-1588058365548-9ded1f2f0c69?w=800&q=80'],
 '{"Width":"160 cm","Depth":"30 cm","Height":"200 cm","Material":"Ash veneer, Steel","Shelves":"6"}'::jsonb),

('00000000-0000-0000-0000-000000000008',
 'Vera Throw', 'TEXTILES', 320,
 'Woven in Portugal from undyed merino wool, the Vera throw carries the natural variation of the fleece. It softens with every wash.',
 'Once Milano',
 array['https://images.unsplash.com/photo-1545289414-1add7f0d39c0?w=800&q=80'],
 '{"Width":"130 cm","Length":"170 cm","Material":"100% Merino wool","Care":"Hand wash cold"}'::jsonb),

('00000000-0000-0000-0000-000000000009',
 'Strata Wall Art', 'ART', 1850,
 'A limited edition archival giclée print by Copenhagen artist Maren Vik. Each print is numbered and arrives with a certificate of authenticity.',
 'Maren Vik Studio',
 array['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80'],
 '{"Size":"80 × 100 cm","Medium":"Archival giclée","Edition":"1/50","Frame":"Unframed"}'::jsonb),

('00000000-0000-0000-0000-000000000010',
 'Koto Vase', 'DECOR', 195,
 'Wheel-thrown in Kyoto from iron-rich stoneware. The subtle ash glaze shifts from grey to warm brown depending on the light. Made to hold a single stem or stand alone.',
 'Kinto',
 array['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80'],
 '{"Diameter":"12 cm","Height":"28 cm","Material":"Stoneware","Glaze":"Ash glaze"}'::jsonb)

on conflict (id) do nothing;
