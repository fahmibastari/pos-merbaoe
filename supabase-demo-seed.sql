/*
  MERBAOE POS — DEMO SEED UNTUK SUPABASE SQL EDITOR
  ==================================================

  PERINGATAN PENTING
  ------------------
  - Script ini DESTRUKTIF untuk tabel aplikasi: seluruh data operasional lama
    dihapus, identity di-reset, lalu diganti dataset demo yang konsisten.
  - Jalankan hanya pada project Supabase development/demo, bukan database yang
    sudah berisi transaksi riil yang perlu dipertahankan.
  - Seluruh perubahan dibungkus satu transaksi. Jika validasi akhir gagal,
    PostgreSQL membatalkan semuanya.
  - Script tidak menyentuh schema auth, storage, atau tabel migrasi Prisma.
  - Foto menu tidak dibuat di sini. File biner harus diunggah melalui UI admin;
    produk memakai fallback tipografis sampai foto asli tersedia.

  CAKUPAN DATA
  ------------
  Pengguna & keamanan login, kategori, menu aktif/nonaktif, bahan baku,
  resep/BOM, saldo opening, pembelian & weighted-average cost, penyesuaian,
  waste + OPEX tertaut, shift kasir terbuka/tertutup, penjualan tunai/QRIS/
  transfer, diskon, PB1, HPP recipe/base/fallback, void + pengembalian stok,
  seluruh kategori beban, audit log, stok menipis, dan ringkasan finansial.

  CARA MENJALANKAN
  ----------------
  1. Pastikan semua migrasi Prisma sudah diterapkan.
  2. Buka Supabase Dashboard -> SQL Editor -> New query.
  3. Tempel seluruh file ini dan klik Run satu kali.
  4. Salin password acak dari result set paling akhir. Password tidak disimpan
     dalam plaintext di tabel dan akan berbeda setiap kali seed dijalankan.
*/

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

SET LOCAL TIME ZONE 'Asia/Jakarta';
SET LOCAL search_path = public, extensions, pg_temp;

CREATE TEMP TABLE _merbaoe_seed_credentials (
  role_label text NOT NULL,
  username text NOT NULL,
  generated_password text NOT NULL
) ON COMMIT PRESERVE ROWS;

INSERT INTO _merbaoe_seed_credentials (role_label, username, generated_password)
VALUES
  ('Administrator', 'admin', 'Adm-' || replace(gen_random_uuid()::text, '-', '') || '!'),
  ('Kasir Pagi', 'kasir', 'Ksr-' || replace(gen_random_uuid()::text, '-', '') || '!'),
  ('Kasir Sore', 'kasir.sore', 'Ksr-' || replace(gen_random_uuid()::text, '-', '') || '!');

TRUNCATE TABLE
  login_attempts,
  audit_logs,
  operational_expenses,
  sales_details,
  sales,
  cashier_shifts,
  purchase_details,
  purchases,
  stock_transactions,
  recipes,
  products,
  product_categories,
  ingredients,
  users
RESTART IDENTITY CASCADE;

ALTER SEQUENCE sales_invoice_seq RESTART WITH 1;

-- ---------------------------------------------------------------------------
-- 1. PENGGUNA DAN KEAMANAN LOGIN
-- ---------------------------------------------------------------------------

INSERT INTO users (
  name,
  username,
  password_hash,
  role,
  is_active,
  session_version,
  last_login_at,
  created_at,
  updated_at
)
SELECT
  seed.name,
  seed.username,
  crypt(credentials.generated_password, gen_salt('bf', 10)),
  seed.role::"Role",
  seed.is_active,
  seed.session_version,
  seed.last_login_at,
  seed.created_at,
  seed.updated_at
FROM (
  VALUES
    (
      'Ayu Lestari', 'admin', 'admin', true, 2,
      now() - interval '45 minutes', now() - interval '180 days', now() - interval '45 minutes'
    ),
    (
      'Raka Pratama', 'kasir', 'kasir', true, 1,
      now() - interval '20 minutes', now() - interval '120 days', now() - interval '20 minutes'
    ),
    (
      'Nadia Putri', 'kasir.sore', 'kasir', true, 1,
      now() - interval '1 day', now() - interval '90 days', now() - interval '1 day'
    )
) AS seed(
  name, username, role, is_active, session_version,
  last_login_at, created_at, updated_at
)
JOIN _merbaoe_seed_credentials AS credentials USING (username);

-- Akun nonaktif menggambarkan siklus manajemen pengguna, bukan akun login demo.
INSERT INTO users (
  name, username, password_hash, role, is_active, session_version,
  last_login_at, created_at, updated_at
)
VALUES (
  'Dimas Saputra',
  'kasir.lama',
  crypt('akun-nonaktif-' || gen_random_uuid()::text, gen_salt('bf', 10)),
  'kasir',
  false,
  3,
  now() - interval '75 days',
  now() - interval '210 days',
  now() - interval '60 days'
);

-- Contoh jejak rate-limit yang tidak sedang memblokir akun operasional.
INSERT INTO login_attempts (
  username, failed_count, window_started_at, blocked_until, updated_at
)
VALUES (
  'salah.ketik', 2, now() - interval '12 minutes', NULL, now() - interval '11 minutes'
);

-- ---------------------------------------------------------------------------
-- 2. KATEGORI, BAHAN BAKU, PRODUK, DAN RESEP
-- ---------------------------------------------------------------------------

INSERT INTO product_categories (
  name, slug, sort_order, is_active, created_at, updated_at
)
VALUES
  ('Kopi',          'kopi',          10, true,  now() - interval '150 days', now() - interval '30 days'),
  ('Non Kopi',      'non-kopi',      20, true,  now() - interval '150 days', now() - interval '30 days'),
  ('Makanan Berat', 'makanan-berat', 30, true,  now() - interval '120 days', now() - interval '20 days'),
  ('Cemilan',       'cemilan',       40, true,  now() - interval '120 days', now() - interval '20 days'),
  ('Musiman',       'musiman',       90, false, now() - interval '90 days',  now() - interval '35 days');

INSERT INTO ingredients (
  name, unit, current_stock, stock_value, average_cost, minimum_stock,
  is_active, created_at, updated_at
)
VALUES
  ('Biji Kopi Arabika',  'gram', 0, 0, 0,  900, true, now() - interval '150 days', now()),
  ('Biji Kopi Robusta',  'gram', 0, 0, 0,  700, true, now() - interval '150 days', now()),
  ('Susu Full Cream',    'ml',   0, 0, 0, 5000, true, now() - interval '150 days', now()),
  ('Sirup Gula Aren',    'ml',   0, 0, 0, 1200, true, now() - interval '150 days', now()),
  ('Gula Pasir',         'gram', 0, 0, 0, 1500, true, now() - interval '150 days', now()),
  ('Bubuk Cokelat',      'gram', 0, 0, 0,  500, true, now() - interval '120 days', now()),
  ('Bubuk Matcha',       'gram', 0, 0, 0,  250, true, now() - interval '120 days', now()),
  ('Teh Melati',         'gram', 0, 0, 0,  300, true, now() - interval '120 days', now()),
  ('Sirup Lemon',        'ml',   0, 0, 0,  600, true, now() - interval '120 days', now()),
  ('Beras',              'gram', 0, 0, 0, 4000, true, now() - interval '120 days', now()),
  ('Daging Ayam',        'gram', 0, 0, 0, 2500, true, now() - interval '120 days', now()),
  ('Bumbu Dapur',        'gram', 0, 0, 0,  600, true, now() - interval '120 days', now()),
  ('Minyak Goreng',      'ml',   0, 0, 0, 1800, true, now() - interval '120 days', now()),
  ('Mi Telur',           'pcs',  0, 0, 0,   24, true, now() - interval '120 days', now()),
  ('Kentang Beku',       'gram', 0, 0, 0, 2500, true, now() - interval '120 days', now()),
  ('Pisang Kepok',       'pcs',  0, 0, 0,  250, true, now() - interval '120 days', now()),
  ('Roti Tawar',         'pcs',  0, 0, 0,  150, true, now() - interval '120 days', now()),
  ('Keju Cheddar',       'gram', 0, 0, 0,  500, true, now() - interval '120 days', now()),
  ('Air Mineral Botol',  'pcs',  0, 0, 0,   24, true, now() - interval '120 days', now()),
  ('Kemasan Take Away',  'pcs',  0, 0, 0,   60, true, now() - interval '120 days', now()),
  ('Sirup Pandan Lama',  'ml',   0, 0, 0,    0, false, now() - interval '90 days', now() - interval '35 days');

INSERT INTO products (
  category_id, name, selling_price, base_hpp, image_path,
  has_recipe, is_active, created_at, updated_at
)
VALUES
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'Americano',              18000,  5000, NULL, true,  true,  now() - interval '150 days', now() - interval '25 days'),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'Espresso',               15000,  4500, NULL, true,  true,  now() - interval '150 days', now() - interval '25 days'),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'Cappuccino',             24000,  8500, NULL, true,  true,  now() - interval '140 days', now() - interval '20 days'),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'Kopi Susu Aren',         22000,  7500, NULL, true,  true,  now() - interval '140 days', now() - interval '20 days'),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'Matcha Latte',        25000, 10000, NULL, true,  true,  now() - interval '120 days', now() - interval '18 days'),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'Cokelat Merbaoe',     23000,  9000, NULL, true,  true,  now() - interval '120 days', now() - interval '18 days'),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'Es Teh Lemon',        18000,  5500, NULL, true,  true,  now() - interval '110 days', now() - interval '15 days'),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'Air Mineral',          8000,  3000, NULL, false, true,  now() - interval '110 days', now() - interval '15 days'),
  ((SELECT id FROM product_categories WHERE slug = 'makanan-berat'), 'Nasi Ayam Rempah',       32000, 14000, NULL, true,  true, now() - interval '100 days', now() - interval '12 days'),
  ((SELECT id FROM product_categories WHERE slug = 'makanan-berat'), 'Rice Bowl Sambal Matah', 34000, 15000, NULL, true,  true, now() - interval '100 days', now() - interval '12 days'),
  ((SELECT id FROM product_categories WHERE slug = 'makanan-berat'), 'Mi Goreng Kampung',       25000, 11000, NULL, true,  true, now() - interval '100 days', now() - interval '12 days'),
  ((SELECT id FROM product_categories WHERE slug = 'cemilan'), 'Kentang Goreng',       20000,  8500, NULL, true,  true,  now() - interval '90 days', now() - interval '10 days'),
  ((SELECT id FROM product_categories WHERE slug = 'cemilan'), 'Pisang Goreng',        18000,  7000, NULL, true,  true,  now() - interval '90 days', now() - interval '10 days'),
  ((SELECT id FROM product_categories WHERE slug = 'cemilan'), 'Roti Bakar Cokelat',   22000,  9500, NULL, true,  true,  now() - interval '90 days', now() - interval '10 days'),
  -- Produk ini sengaja has_recipe=true tanpa BOM agar jalur HPP fallback terlihat.
  ((SELECT id FROM product_categories WHERE slug = 'cemilan'), 'Croissant Butter',     24000, 12000, NULL, true,  true,  now() - interval '45 days', now() - interval '8 days'),
  ((SELECT id FROM product_categories WHERE slug = 'musiman'), 'Es Kopi Pandan',       24000,  8000, NULL, true,  false, now() - interval '90 days', now() - interval '35 days');

INSERT INTO recipes (product_id, ingredient_id, quantity_needed)
SELECT product.id, ingredient.id, recipe.quantity_needed
FROM (
  VALUES
    ('Americano', 'Biji Kopi Arabika', 18.000::numeric),
    ('Americano', 'Kemasan Take Away',  1.000::numeric),
    ('Espresso', 'Biji Kopi Arabika',  18.000::numeric),
    ('Espresso', 'Kemasan Take Away',   1.000::numeric),
    ('Cappuccino', 'Biji Kopi Arabika', 18.000::numeric),
    ('Cappuccino', 'Susu Full Cream',  180.000::numeric),
    ('Cappuccino', 'Gula Pasir',         5.000::numeric),
    ('Cappuccino', 'Kemasan Take Away',  1.000::numeric),
    ('Kopi Susu Aren', 'Biji Kopi Robusta', 18.000::numeric),
    ('Kopi Susu Aren', 'Susu Full Cream',  130.000::numeric),
    ('Kopi Susu Aren', 'Sirup Gula Aren',   25.000::numeric),
    ('Kopi Susu Aren', 'Kemasan Take Away',  1.000::numeric),
    ('Matcha Latte', 'Bubuk Matcha',       10.000::numeric),
    ('Matcha Latte', 'Susu Full Cream',    180.000::numeric),
    ('Matcha Latte', 'Gula Pasir',          10.000::numeric),
    ('Matcha Latte', 'Kemasan Take Away',    1.000::numeric),
    ('Cokelat Merbaoe', 'Bubuk Cokelat',    20.000::numeric),
    ('Cokelat Merbaoe', 'Susu Full Cream', 180.000::numeric),
    ('Cokelat Merbaoe', 'Gula Pasir',       10.000::numeric),
    ('Cokelat Merbaoe', 'Kemasan Take Away', 1.000::numeric),
    ('Es Teh Lemon', 'Teh Melati',           8.000::numeric),
    ('Es Teh Lemon', 'Sirup Lemon',          25.000::numeric),
    ('Es Teh Lemon', 'Gula Pasir',           10.000::numeric),
    ('Es Teh Lemon', 'Kemasan Take Away',     1.000::numeric),
    ('Nasi Ayam Rempah', 'Beras',           180.000::numeric),
    ('Nasi Ayam Rempah', 'Daging Ayam',     120.000::numeric),
    ('Nasi Ayam Rempah', 'Bumbu Dapur',      20.000::numeric),
    ('Nasi Ayam Rempah', 'Minyak Goreng',    15.000::numeric),
    ('Nasi Ayam Rempah', 'Kemasan Take Away', 1.000::numeric),
    ('Rice Bowl Sambal Matah', 'Beras',       180.000::numeric),
    ('Rice Bowl Sambal Matah', 'Daging Ayam', 100.000::numeric),
    ('Rice Bowl Sambal Matah', 'Bumbu Dapur',  25.000::numeric),
    ('Rice Bowl Sambal Matah', 'Minyak Goreng', 15.000::numeric),
    ('Rice Bowl Sambal Matah', 'Kemasan Take Away', 1.000::numeric),
    ('Mi Goreng Kampung', 'Mi Telur',          1.000::numeric),
    ('Mi Goreng Kampung', 'Daging Ayam',      60.000::numeric),
    ('Mi Goreng Kampung', 'Bumbu Dapur',      15.000::numeric),
    ('Mi Goreng Kampung', 'Minyak Goreng',    10.000::numeric),
    ('Mi Goreng Kampung', 'Kemasan Take Away', 1.000::numeric),
    ('Kentang Goreng', 'Kentang Beku',        180.000::numeric),
    ('Kentang Goreng', 'Minyak Goreng',        20.000::numeric),
    ('Kentang Goreng', 'Bumbu Dapur',           5.000::numeric),
    ('Kentang Goreng', 'Kemasan Take Away',     1.000::numeric),
    ('Pisang Goreng', 'Pisang Kepok',            2.000::numeric),
    ('Pisang Goreng', 'Minyak Goreng',           20.000::numeric),
    ('Pisang Goreng', 'Gula Pasir',              10.000::numeric),
    ('Pisang Goreng', 'Kemasan Take Away',        1.000::numeric),
    ('Roti Bakar Cokelat', 'Roti Tawar',          2.000::numeric),
    ('Roti Bakar Cokelat', 'Bubuk Cokelat',      15.000::numeric),
    ('Roti Bakar Cokelat', 'Keju Cheddar',       20.000::numeric),
    ('Roti Bakar Cokelat', 'Kemasan Take Away',   1.000::numeric),
    ('Es Kopi Pandan', 'Biji Kopi Robusta',      18.000::numeric),
    ('Es Kopi Pandan', 'Susu Full Cream',       130.000::numeric),
    ('Es Kopi Pandan', 'Sirup Pandan Lama',      25.000::numeric),
    ('Es Kopi Pandan', 'Kemasan Take Away',       1.000::numeric)
) AS recipe(product_name, ingredient_name, quantity_needed)
JOIN products AS product ON product.name = recipe.product_name
JOIN ingredients AS ingredient ON ingredient.name = recipe.ingredient_name;

-- ---------------------------------------------------------------------------
-- 3. HELPER TEMPORER: LEDGER STOK, PEMBELIAN, DAN PENJUALAN
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.demo_stock_in(
  p_ingredient_id integer,
  p_quantity numeric,
  p_unit_cost numeric,
  p_source "StockSource",
  p_reference_type "ReferenceType",
  p_reference_id integer,
  p_notes text,
  p_actor_id integer,
  p_when timestamptz
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_row ingredients%ROWTYPE;
  next_stock numeric(14,3);
  next_value numeric(14,2);
  next_average numeric(14,4);
  movement_id integer;
BEGIN
  IF p_quantity <= 0 OR p_unit_cost < 0 THEN
    RAISE EXCEPTION 'Mutasi masuk tidak sah: quantity %, unit cost %', p_quantity, p_unit_cost;
  END IF;

  SELECT * INTO STRICT current_row
  FROM ingredients
  WHERE id = p_ingredient_id
  FOR UPDATE;

  next_stock := round(current_row.current_stock + p_quantity, 3);
  next_value := round(current_row.stock_value + (p_quantity * p_unit_cost), 0);
  next_average := CASE
    -- Opname tambah memakai average cost berjalan dan tidak menghitung ulang
    -- harga rata-rata, sama seperti applyStockInAtAverageCost di aplikasi.
    WHEN p_source = 'adjustment' THEN current_row.average_cost
    WHEN next_stock = 0 THEN current_row.average_cost
    ELSE round(next_value / next_stock, 4)
  END;

  UPDATE ingredients
  SET current_stock = next_stock,
      stock_value = next_value,
      average_cost = next_average,
      updated_at = p_when
  WHERE id = p_ingredient_id;

  INSERT INTO stock_transactions (
    ingredient_id, type, quantity, unit_cost, total_cost,
    balance_after, value_after, source, reference_type, reference_id,
    notes, created_by, transaction_date
  )
  VALUES (
    p_ingredient_id, 'in', round(p_quantity, 3), round(p_unit_cost, 4),
    round(p_quantity * p_unit_cost, 0), next_stock, next_value,
    p_source, p_reference_type, p_reference_id, left(p_notes, 255),
    p_actor_id, p_when
  )
  RETURNING id INTO movement_id;

  RETURN movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_stock_out(
  p_ingredient_id integer,
  p_quantity numeric,
  p_source "StockSource",
  p_reference_type "ReferenceType",
  p_reference_id integer,
  p_notes text,
  p_actor_id integer,
  p_when timestamptz
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_row ingredients%ROWTYPE;
  next_stock numeric(14,3);
  next_value numeric(14,2);
  movement_cost numeric(14,2);
  movement_id integer;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Mutasi keluar harus lebih dari nol: %', p_quantity;
  END IF;

  SELECT * INTO STRICT current_row
  FROM ingredients
  WHERE id = p_ingredient_id
  FOR UPDATE;

  IF current_row.current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stok % tidak cukup. Keluar %, tersedia %',
      current_row.name, p_quantity, current_row.current_stock;
  END IF;

  next_stock := round(current_row.current_stock - p_quantity, 3);
  next_value := CASE
    WHEN next_stock = 0 THEN 0
    ELSE greatest(0, round(current_row.stock_value - (p_quantity * current_row.average_cost), 0))
  END;
  movement_cost := round(p_quantity * current_row.average_cost, 0);

  UPDATE ingredients
  SET current_stock = next_stock,
      stock_value = next_value,
      updated_at = p_when
  WHERE id = p_ingredient_id;

  INSERT INTO stock_transactions (
    ingredient_id, type, quantity, unit_cost, total_cost,
    balance_after, value_after, source, reference_type, reference_id,
    notes, created_by, transaction_date
  )
  VALUES (
    p_ingredient_id, 'out', round(p_quantity, 3), current_row.average_cost,
    movement_cost, next_stock, next_value, p_source,
    p_reference_type, p_reference_id, left(p_notes, 255), p_actor_id, p_when
  )
  RETURNING id INTO movement_id;

  RETURN movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_stock_return(
  p_ingredient_id integer,
  p_quantity numeric,
  p_unit_cost numeric,
  p_total_cost numeric,
  p_sale_id integer,
  p_notes text,
  p_actor_id integer,
  p_when timestamptz
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_row ingredients%ROWTYPE;
  next_stock numeric(14,3);
  next_value numeric(14,2);
  movement_id integer;
BEGIN
  SELECT * INTO STRICT current_row
  FROM ingredients
  WHERE id = p_ingredient_id
  FOR UPDATE;

  next_stock := round(current_row.current_stock + p_quantity, 3);
  next_value := round(current_row.stock_value + p_total_cost, 0);

  UPDATE ingredients
  SET current_stock = next_stock,
      stock_value = next_value,
      updated_at = p_when
  WHERE id = p_ingredient_id;

  INSERT INTO stock_transactions (
    ingredient_id, type, quantity, unit_cost, total_cost,
    balance_after, value_after, source, reference_type, reference_id,
    notes, created_by, transaction_date
  )
  VALUES (
    p_ingredient_id, 'in', round(p_quantity, 3), round(p_unit_cost, 4),
    round(p_total_cost, 0), next_stock, next_value, 'sale_void', 'sale',
    p_sale_id, left(p_notes, 255), p_actor_id, p_when
  )
  RETURNING id INTO movement_id;

  RETURN movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_purchase(
  p_purchase_date date,
  p_supplier text,
  p_notes text,
  p_actor_id integer,
  p_ingredient_names text[],
  p_quantities numeric[],
  p_unit_costs numeric[]
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_purchase_id integer;
  purchase_total numeric(14,2) := 0;
  item record;
  v_ingredient_id integer;
  purchased_at timestamptz := (p_purchase_date + time '07:15') AT TIME ZONE 'Asia/Jakarta';
BEGIN
  IF cardinality(p_ingredient_names) IS DISTINCT FROM cardinality(p_quantities)
     OR cardinality(p_quantities) IS DISTINCT FROM cardinality(p_unit_costs) THEN
    RAISE EXCEPTION 'Array detail pembelian tidak sejajar.';
  END IF;

  SELECT coalesce(sum(round(row.quantity * row.unit_cost, 0)), 0)
  INTO purchase_total
  FROM unnest(p_quantities, p_unit_costs) AS row(quantity, unit_cost);

  INSERT INTO purchases (
    invoice_number, supplier_name, total_amount, purchase_date,
    notes, created_by, created_at
  )
  VALUES (
    'PO-' || to_char(p_purchase_date, 'YYYYMMDD') || '-' ||
      lpad((SELECT (count(*) + 1)::text FROM purchases), 3, '0'),
    p_supplier, purchase_total, p_purchase_date, left(p_notes, 255),
    p_actor_id, purchased_at
  )
  RETURNING id INTO v_purchase_id;

  FOR item IN
    SELECT *
    FROM unnest(p_ingredient_names, p_quantities, p_unit_costs)
      AS rows(ingredient_name, quantity, unit_cost)
  LOOP
    SELECT id INTO STRICT v_ingredient_id
    FROM ingredients
    WHERE name = item.ingredient_name AND is_active = true;

    INSERT INTO purchase_details (
      purchase_id, ingredient_id, quantity, unit_cost, subtotal
    )
    VALUES (
      v_purchase_id, v_ingredient_id, round(item.quantity, 3),
      round(item.unit_cost, 4), round(item.quantity * item.unit_cost, 0)
    );

    PERFORM pg_temp.demo_stock_in(
      v_ingredient_id,
      item.quantity,
      item.unit_cost,
      'purchase',
      'purchase',
      v_purchase_id,
      'Pembelian dari ' || p_supplier,
      p_actor_id,
      purchased_at
    );
  END LOOP;

  RETURN v_purchase_id;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_sale(
  p_shift_id integer,
  p_cashier_id integer,
  p_when timestamptz,
  p_payment_method "PaymentMethod",
  p_discount numeric,
  p_tax_rate numeric,
  p_product_names text[],
  p_quantities integer[],
  p_should_void boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id integer;
  item record;
  product_row products%ROWTYPE;
  stock_row record;
  original_movement record;
  recipe_count integer;
  recipe_ready boolean;
  item_hpp numeric(14,2);
  item_hpp_source "HppSource";
  subtotal_amount numeric(14,2) := 0;
  total_hpp numeric(14,2) := 0;
  net_amount numeric(14,2);
  tax_amount numeric(14,2);
  total_amount numeric(14,2);
  gross_profit numeric(14,2);
  cash_received numeric(14,2);
  change_amount numeric(14,2);
  invoice_number text;
  v_voided_at timestamptz;
BEGIN
  IF cardinality(p_product_names) IS DISTINCT FROM cardinality(p_quantities)
     OR cardinality(p_product_names) = 0 THEN
    RAISE EXCEPTION 'Item penjualan kosong atau array tidak sejajar.';
  END IF;

  FOR item IN
    SELECT * FROM unnest(p_product_names, p_quantities)
      AS rows(product_name, quantity)
  LOOP
    SELECT * INTO STRICT product_row
    FROM products
    WHERE name = item.product_name AND is_active = true;

    IF item.quantity <= 0 THEN
      RAISE EXCEPTION 'Kuantitas jual % tidak sah.', item.quantity;
    END IF;

    IF NOT product_row.has_recipe THEN
      item_hpp := round(product_row.base_hpp, 0);
    ELSE
      SELECT
        count(*)::integer,
        coalesce(bool_and(ingredient.average_cost > 0), false),
        round(coalesce(sum(recipe.quantity_needed * ingredient.average_cost), 0), 0)
      INTO recipe_count, recipe_ready, item_hpp
      FROM recipes AS recipe
      JOIN ingredients AS ingredient ON ingredient.id = recipe.ingredient_id
      WHERE recipe.product_id = product_row.id;

      IF recipe_count = 0 OR NOT recipe_ready THEN
        item_hpp := round(product_row.base_hpp, 0);
      END IF;
    END IF;

    subtotal_amount := subtotal_amount + round(product_row.selling_price * item.quantity, 0);
    total_hpp := total_hpp + round(item_hpp * item.quantity, 0);
  END LOOP;

  IF p_discount < 0 OR p_discount > subtotal_amount THEN
    RAISE EXCEPTION 'Diskon % tidak sah untuk subtotal %.', p_discount, subtotal_amount;
  END IF;

  net_amount := round(subtotal_amount - p_discount, 0);
  tax_amount := round(net_amount * p_tax_rate, 0);
  total_amount := net_amount + tax_amount;
  gross_profit := net_amount - total_hpp;
  invoice_number := 'TRX-' || to_char(p_when AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' ||
    lpad(nextval('sales_invoice_seq')::text, 5, '0');

  IF p_payment_method = 'cash' THEN
    cash_received := ceil(total_amount / 10000) * 10000;
    change_amount := cash_received - total_amount;
  ELSE
    cash_received := NULL;
    change_amount := NULL;
  END IF;

  INSERT INTO sales (
    invoice_number, idempotency_key, request_fingerprint,
    cashier_id, shift_id, subtotal_amount, discount_amount,
    net_amount, tax_rate, tax_amount, total_amount,
    total_hpp, gross_profit, payment_method,
    cash_received, change_amount, status, transaction_date
  )
  VALUES (
    invoice_number,
    gen_random_uuid(),
    md5(invoice_number || ':demo:a') || md5(invoice_number || ':demo:b'),
    p_cashier_id,
    p_shift_id,
    subtotal_amount,
    round(p_discount, 0),
    net_amount,
    p_tax_rate,
    tax_amount,
    total_amount,
    total_hpp,
    gross_profit,
    p_payment_method,
    cash_received,
    change_amount,
    'completed',
    p_when
  )
  RETURNING id INTO v_sale_id;

  FOR item IN
    SELECT * FROM unnest(p_product_names, p_quantities)
      AS rows(product_name, quantity)
  LOOP
    SELECT * INTO STRICT product_row
    FROM products
    WHERE name = item.product_name AND is_active = true;

    IF NOT product_row.has_recipe THEN
      item_hpp := round(product_row.base_hpp, 0);
      item_hpp_source := 'base';
    ELSE
      SELECT
        count(*)::integer,
        coalesce(bool_and(ingredient.average_cost > 0), false),
        round(coalesce(sum(recipe.quantity_needed * ingredient.average_cost), 0), 0)
      INTO recipe_count, recipe_ready, item_hpp
      FROM recipes AS recipe
      JOIN ingredients AS ingredient ON ingredient.id = recipe.ingredient_id
      WHERE recipe.product_id = product_row.id;

      IF recipe_count = 0 OR NOT recipe_ready THEN
        item_hpp := round(product_row.base_hpp, 0);
        item_hpp_source := 'fallback';
      ELSE
        item_hpp_source := 'recipe';
      END IF;
    END IF;

    INSERT INTO sales_details (
      sale_id, product_id, product_name, quantity, selling_price,
      hpp_snapshot, hpp_source, subtotal, gross_profit_snapshot
    )
    VALUES (
      v_sale_id,
      product_row.id,
      product_row.name,
      item.quantity,
      product_row.selling_price,
      item_hpp,
      item_hpp_source,
      round(product_row.selling_price * item.quantity, 0),
      round((product_row.selling_price - item_hpp) * item.quantity, 0)
    );
  END LOOP;

  -- Checkout aplikasi mengagregasi kebutuhan yang sama menjadi satu mutasi per bahan.
  FOR stock_row IN
    SELECT
      recipe.ingredient_id,
      sum(recipe.quantity_needed * sold.quantity)::numeric AS quantity
    FROM unnest(p_product_names, p_quantities) AS sold(product_name, quantity)
    JOIN products AS product ON product.name = sold.product_name
    JOIN recipes AS recipe ON recipe.product_id = product.id
    GROUP BY recipe.ingredient_id
    ORDER BY recipe.ingredient_id
  LOOP
    PERFORM pg_temp.demo_stock_out(
      stock_row.ingredient_id,
      stock_row.quantity,
      'sale',
      'sale',
      v_sale_id,
      'Pemakaian bahan untuk ' || invoice_number,
      p_cashier_id,
      p_when
    );
  END LOOP;

  IF p_should_void THEN
    v_voided_at := p_when + interval '20 minutes';

    FOR original_movement IN
      SELECT ingredient_id, quantity, unit_cost, total_cost
      FROM stock_transactions
      WHERE source = 'sale'
        AND type = 'out'
        AND reference_type = 'sale'
        AND reference_id = v_sale_id
      ORDER BY ingredient_id
    LOOP
      PERFORM pg_temp.demo_stock_return(
        original_movement.ingredient_id,
        original_movement.quantity,
        original_movement.unit_cost,
        original_movement.total_cost,
        v_sale_id,
        'Void ' || invoice_number || ': pelanggan salah memilih pesanan',
        (SELECT id FROM users WHERE username = 'admin'),
        v_voided_at
      );
    END LOOP;

    UPDATE sales
    SET status = 'voided',
        void_reason = 'Pelanggan salah memilih pesanan',
        voided_by = (SELECT id FROM users WHERE username = 'admin'),
        voided_at = v_voided_at
    WHERE id = v_sale_id;

    INSERT INTO audit_logs (
      user_id, action, entity, entity_id, before_data, after_data, created_at
    )
    VALUES (
      (SELECT id FROM users WHERE username = 'admin'),
      'void',
      'sale',
      v_sale_id,
      jsonb_build_object('status', 'completed'),
      jsonb_build_object(
        'status', 'voided',
        'reason', 'Pelanggan salah memilih pesanan',
        'voidedAt', v_voided_at
      ),
      v_voided_at
    );
  END IF;

  RETURN v_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_operational_day(
  p_day date,
  p_today date,
  p_start_date date
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_shift_id integer;
  v_cashier_id integer;
  sale_number integer;
  payment_method "PaymentMethod";
  product_names text[];
  quantities integer[];
  discount_amount numeric;
  tax_rate numeric;
  sale_time timestamptz;
  v_opening_cash numeric(14,2) := 500000;
  v_cash_sales numeric(14,2);
  v_drawer_expenses numeric(14,2);
  v_expected_cash numeric(14,2);
  v_actual_cash numeric(14,2);
  v_cash_difference numeric(14,2);
  v_closing_notes text;
  max_sales integer;
BEGIN
  v_cashier_id := CASE
    WHEN mod(p_day - p_start_date, 2) = 0
      THEN (SELECT id FROM users WHERE username = 'kasir')
    ELSE (SELECT id FROM users WHERE username = 'kasir.sore')
  END;

  INSERT INTO cashier_shifts (
    cashier_id, opening_cash, status, notes, opened_at
  )
  VALUES (
    v_cashier_id,
    v_opening_cash,
    'open',
    CASE WHEN p_day = p_today THEN 'Shift berjalan' ELSE NULL END,
    (p_day + time '07:45') AT TIME ZONE 'Asia/Jakarta'
  )
  RETURNING id INTO v_shift_id;

  INSERT INTO audit_logs (
    user_id, action, entity, entity_id, before_data, after_data, created_at
  )
  VALUES (
    v_cashier_id,
    'create',
    'cashier_shift',
    v_shift_id,
    NULL,
    jsonb_build_object('status', 'open', 'openingCash', v_opening_cash),
    (p_day + time '07:45') AT TIME ZONE 'Asia/Jakarta'
  );

  max_sales := CASE WHEN p_day = p_today THEN 4 ELSE 8 END;

  FOR sale_number IN 1..max_sales LOOP
    CASE sale_number
      WHEN 1 THEN
        product_names := ARRAY['Americano', 'Kentang Goreng'];
        quantities := ARRAY[1, 1];
      WHEN 2 THEN
        product_names := ARRAY['Kopi Susu Aren'];
        quantities := ARRAY[2];
      WHEN 3 THEN
        product_names := ARRAY['Nasi Ayam Rempah', 'Es Teh Lemon'];
        quantities := ARRAY[1, 1];
      WHEN 4 THEN
        product_names := ARRAY['Matcha Latte', 'Pisang Goreng'];
        quantities := ARRAY[1, 1];
      WHEN 5 THEN
        product_names := ARRAY['Cappuccino', 'Croissant Butter'];
        quantities := ARRAY[1, 1];
      WHEN 6 THEN
        product_names := ARRAY['Air Mineral', 'Rice Bowl Sambal Matah'];
        quantities := ARRAY[1, 1];
      WHEN 7 THEN
        product_names := ARRAY['Cokelat Merbaoe', 'Roti Bakar Cokelat'];
        quantities := ARRAY[1, 1];
      ELSE
        product_names := ARRAY['Mi Goreng Kampung', 'Espresso'];
        quantities := ARRAY[1, 1];
    END CASE;

    payment_method := CASE mod((p_day - p_start_date) + sale_number, 5)
      WHEN 0 THEN 'transfer'::"PaymentMethod"
      WHEN 1 THEN 'qris'::"PaymentMethod"
      ELSE 'cash'::"PaymentMethod"
    END;
    discount_amount := CASE
      WHEN mod((p_day - p_start_date) + sale_number, 9) = 0 THEN 5000
      ELSE 0
    END;
    tax_rate := CASE
      WHEN mod((p_day - p_start_date) + sale_number, 6) = 0 THEN 0.1000
      ELSE 0.0000
    END;
    sale_time := (
      p_day + time '08:10' + (sale_number * interval '58 minutes')
    ) AT TIME ZONE 'Asia/Jakarta';

    PERFORM pg_temp.demo_sale(
      v_shift_id,
      v_cashier_id,
      sale_time,
      payment_method,
      discount_amount,
      tax_rate,
      product_names,
      quantities,
      p_day = (p_start_date + 11) AND sale_number = 6
    );
  END LOOP;

  -- Pengeluaran dari laci kas hanya muncul pada hari tertentu.
  IF mod(p_day - p_start_date, 6) = 0 THEN
    INSERT INTO operational_expenses (
      description, category, amount, expense_date, created_by,
      cashier_shift_id, stock_transaction_id, created_at
    )
    VALUES (
      'Pembelian galon darurat dari laci kas',
      'lain_lain',
      28000,
      p_day,
      v_cashier_id,
      v_shift_id,
      NULL,
      (p_day + time '14:30') AT TIME ZONE 'Asia/Jakarta'
    );
  END IF;

  IF p_day < p_today THEN
    SELECT coalesce(sum(total_amount), 0)
    INTO v_cash_sales
    FROM sales AS sale
    WHERE sale.shift_id = v_shift_id
      AND sale.payment_method = 'cash'
      AND sale.status = 'completed';

    SELECT coalesce(sum(amount), 0)
    INTO v_drawer_expenses
    FROM operational_expenses AS expense
    WHERE expense.cashier_shift_id = v_shift_id;

    v_expected_cash := v_opening_cash + v_cash_sales - v_drawer_expenses;
    v_cash_difference := CASE
      WHEN mod(p_day - p_start_date, 13) = 0 THEN -2000
      WHEN mod(p_day - p_start_date, 17) = 0 THEN 1000
      ELSE 0
    END;
    v_actual_cash := v_expected_cash + v_cash_difference;
    v_closing_notes := CASE
      WHEN v_cash_difference < 0 THEN 'Selisih kurang saat hitung pecahan kecil'
      WHEN v_cash_difference > 0 THEN 'Selisih lebih saat rekonsiliasi kas'
      ELSE NULL
    END;

    UPDATE cashier_shifts
    SET expected_cash = v_expected_cash,
        actual_cash = v_actual_cash,
        difference = v_cash_difference,
        status = 'closed',
        notes = v_closing_notes,
        closed_at = (p_day + time '17:30') AT TIME ZONE 'Asia/Jakarta'
    WHERE id = v_shift_id;

    INSERT INTO audit_logs (
      user_id, action, entity, entity_id, before_data, after_data, created_at
    )
    VALUES (
      v_cashier_id,
      'update',
      'cashier_shift',
      v_shift_id,
      jsonb_build_object('status', 'open', 'openingCash', v_opening_cash),
      jsonb_build_object(
        'status', 'closed',
        'openingCash', v_opening_cash,
        'cashSales', v_cash_sales,
        'cashDrawerExpenses', v_drawer_expenses,
        'expectedCash', v_expected_cash,
        'actualCash', v_actual_cash,
        'difference', v_cash_difference,
        'notes', v_closing_notes
      ),
      (p_day + time '17:30') AT TIME ZONE 'Asia/Jakarta'
    );
  END IF;

  RETURN v_shift_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. SALDO OPENING, PEMBELIAN, OPERASIONAL 30 HARI, OPNAME, DAN WASTE
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  today_wib date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  start_date date := ((now() AT TIME ZONE 'Asia/Jakarta')::date - 29);
  operation_date date;
  day_index integer;
  admin_id integer := (SELECT id FROM users WHERE username = 'admin');
  v_ingredient_id integer;
  item record;
  movement_id integer;
  movement_cost numeric(14,2);
BEGIN
  -- Saldo opening memakai ledger, bukan mengisi current_stock secara langsung.
  FOR item IN
    SELECT * FROM (
      VALUES
        ('Biji Kopi Arabika', 3500.000::numeric, 152.0000::numeric),
        ('Biji Kopi Robusta', 2500.000::numeric,  96.0000::numeric),
        ('Susu Full Cream',  20000.000::numeric,  20.0000::numeric),
        ('Sirup Gula Aren',   6000.000::numeric,  32.0000::numeric),
        ('Gula Pasir',        6000.000::numeric,  18.0000::numeric),
        ('Bubuk Cokelat',     2500.000::numeric,  86.0000::numeric),
        ('Bubuk Matcha',      1200.000::numeric, 305.0000::numeric),
        ('Teh Melati',        1500.000::numeric,  72.0000::numeric),
        ('Sirup Lemon',       4000.000::numeric,  36.0000::numeric),
        ('Beras',            18000.000::numeric,  18.0000::numeric),
        ('Daging Ayam',      12000.000::numeric,  56.0000::numeric),
        ('Bumbu Dapur',       3000.000::numeric,  62.0000::numeric),
        ('Minyak Goreng',     8000.000::numeric,  19.0000::numeric),
        ('Mi Telur',           120.000::numeric, 2600.0000::numeric),
        ('Kentang Beku',     12000.000::numeric,  31.0000::numeric),
        ('Pisang Kepok',       180.000::numeric, 2550.0000::numeric),
        ('Roti Tawar',         120.000::numeric, 3100.0000::numeric),
        ('Keju Cheddar',      3000.000::numeric,  92.0000::numeric),
        ('Air Mineral Botol',   72.000::numeric, 3000.0000::numeric),
        ('Kemasan Take Away',  300.000::numeric,  850.0000::numeric),
        ('Sirup Pandan Lama',  500.000::numeric,   0.0000::numeric)
    ) AS opening(ingredient_name, quantity, unit_cost)
  LOOP
    SELECT id INTO STRICT v_ingredient_id
    FROM ingredients
    WHERE name = item.ingredient_name;

    PERFORM pg_temp.demo_stock_in(
      v_ingredient_id,
      item.quantity,
      item.unit_cost,
      'opening',
      NULL,
      NULL,
      'Saldo pembukaan dataset demo',
      admin_id,
      (start_date + time '06:00') AT TIME ZONE 'Asia/Jakarta'
    );
  END LOOP;

  FOR day_index IN 1..29 LOOP
    operation_date := start_date + day_index;

    -- Pembelian diproses sebelum transaksi hari tersebut agar average cost temporal benar.
    IF day_index = 1 THEN
      PERFORM pg_temp.demo_purchase(
        operation_date,
        'Roastery Flores Timur',
        'Restock awal periode biji kopi',
        admin_id,
        ARRAY['Biji Kopi Arabika', 'Biji Kopi Robusta'],
        ARRAY[2500.000, 2000.000]::numeric[],
        ARRAY[158.0000, 99.0000]::numeric[]
      );
      PERFORM pg_temp.demo_purchase(
        operation_date,
        'CV Dapur Sejahtera',
        'Bahan minuman dan kemasan awal periode',
        admin_id,
        ARRAY[
          'Susu Full Cream', 'Sirup Gula Aren', 'Gula Pasir',
          'Bubuk Cokelat', 'Bubuk Matcha', 'Teh Melati',
          'Sirup Lemon', 'Kemasan Take Away'
        ],
        ARRAY[15000.000, 3000.000, 4000.000, 1500.000, 600.000, 800.000, 2000.000, 200.000]::numeric[],
        ARRAY[21.0000, 34.0000, 18.5000, 88.0000, 315.0000, 74.0000, 37.0000, 875.0000]::numeric[]
      );
    ELSIF day_index = 14 THEN
      PERFORM pg_temp.demo_purchase(
        operation_date,
        'UD Pangan Larantuka',
        'Restock dapur pertengahan periode',
        admin_id,
        ARRAY[
          'Beras', 'Daging Ayam', 'Bumbu Dapur', 'Minyak Goreng',
          'Mi Telur', 'Kentang Beku', 'Pisang Kepok', 'Roti Tawar',
          'Keju Cheddar', 'Air Mineral Botol'
        ],
        ARRAY[12000.000, 8000.000, 2000.000, 5000.000, 72.000, 8000.000, 120.000, 80.000, 1800.000, 48.000]::numeric[],
        ARRAY[18.5000, 58.0000, 64.0000, 20.0000, 2700.0000, 32.0000, 2650.0000, 3200.0000, 95.0000, 3100.0000]::numeric[]
      );
    ELSIF day_index = 23 THEN
      PERFORM pg_temp.demo_purchase(
        operation_date,
        'CV Dapur Sejahtera',
        'Restock cepat menjelang akhir periode',
        admin_id,
        ARRAY['Susu Full Cream', 'Biji Kopi Arabika', 'Kemasan Take Away'],
        ARRAY[12000.000, 1800.000, 150.000]::numeric[],
        ARRAY[21.5000, 160.0000, 900.0000]::numeric[]
      );
    END IF;

    IF day_index >= 2 THEN
      PERFORM pg_temp.demo_operational_day(operation_date, today_wib, start_date);
    END IF;

    -- Opname tambah: barang terselip ditemukan saat penghitungan fisik.
    IF day_index = 9 THEN
      SELECT id INTO v_ingredient_id FROM ingredients WHERE name = 'Biji Kopi Arabika';
      PERFORM pg_temp.demo_stock_in(
        v_ingredient_id,
        40.000,
        (SELECT average_cost FROM ingredients WHERE id = v_ingredient_id),
        'adjustment',
        NULL,
        NULL,
        'Opname: satu kemasan sampel belum tercatat',
        admin_id,
        (operation_date + time '18:15') AT TIME ZONE 'Asia/Jakarta'
      );
    END IF;

    -- Waste menciptakan mutasi stok dan OPEX yang tertaut satu-ke-satu.
    IF day_index = 12 THEN
      SELECT id INTO v_ingredient_id FROM ingredients WHERE name = 'Susu Full Cream';
      movement_id := pg_temp.demo_stock_out(
        v_ingredient_id,
        350.000,
        'waste',
        NULL,
        NULL,
        'Susu rusak karena kemasan bocor',
        admin_id,
        (operation_date + time '16:20') AT TIME ZONE 'Asia/Jakarta'
      );
      SELECT total_cost INTO movement_cost
      FROM stock_transactions WHERE id = movement_id;

      INSERT INTO operational_expenses (
        description, category, amount, expense_date, created_by,
        cashier_shift_id, stock_transaction_id, created_at
      )
      VALUES (
        'Waste Susu Full Cream: kemasan bocor',
        'lain_lain',
        movement_cost,
        operation_date,
        admin_id,
        NULL,
        movement_id,
        (operation_date + time '16:20') AT TIME ZONE 'Asia/Jakarta'
      );
    END IF;

    -- Opname kurang: selisih kecil tanpa membuat beban waste otomatis.
    IF day_index = 20 THEN
      SELECT id INTO v_ingredient_id FROM ingredients WHERE name = 'Gula Pasir';
      PERFORM pg_temp.demo_stock_out(
        v_ingredient_id,
        75.000,
        'adjustment',
        NULL,
        NULL,
        'Opname bulanan: selisih pemakaian dapur',
        admin_id,
        (operation_date + time '18:10') AT TIME ZONE 'Asia/Jakarta'
      );
    END IF;
  END LOOP;

  -- Beban periodik non-persediaan. Pembelian supplier tidak dimasukkan ke OPEX.
  INSERT INTO operational_expenses (
    description, category, amount, expense_date, created_by,
    cashier_shift_id, stock_transaction_id, created_at
  )
  VALUES
    ('Sewa tempat periode berjalan', 'sewa', 2500000, start_date + 1, admin_id, NULL, NULL,
      (start_date + 1 + time '09:00') AT TIME ZONE 'Asia/Jakarta'),
    ('Tagihan listrik dan air', 'utilitas', 875000, start_date + 7, admin_id, NULL, NULL,
      (start_date + 7 + time '10:00') AT TIME ZONE 'Asia/Jakarta'),
    ('Servis berkala mesin espresso', 'pemeliharaan', 425000, start_date + 16, admin_id, NULL, NULL,
      (start_date + 16 + time '11:00') AT TIME ZONE 'Asia/Jakarta'),
    ('Perlengkapan kebersihan outlet', 'lain_lain', 185000, start_date + 22, admin_id, NULL, NULL,
      (start_date + 22 + time '13:00') AT TIME ZONE 'Asia/Jakarta');
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. AUDIT MASTER DATA DAN SIKLUS MANAJEMEN
-- ---------------------------------------------------------------------------

INSERT INTO audit_logs (
  user_id, action, entity, entity_id, before_data, after_data, created_at
)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  'create',
  'product_category',
  category.id,
  NULL,
  jsonb_build_object(
    'name', category.name,
    'slug', category.slug,
    'sortOrder', category.sort_order,
    'isActive', category.is_active
  ),
  category.created_at
FROM product_categories AS category;

INSERT INTO audit_logs (
  user_id, action, entity, entity_id, before_data, after_data, created_at
)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  'create',
  'ingredient',
  ingredient.id,
  NULL,
  jsonb_build_object(
    'name', ingredient.name,
    'unit', ingredient.unit,
    'minimumStock', ingredient.minimum_stock,
    'isActive', ingredient.is_active
  ),
  ingredient.created_at
FROM ingredients AS ingredient;

INSERT INTO audit_logs (
  user_id, action, entity, entity_id, before_data, after_data, created_at
)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  'create',
  'product',
  product.id,
  NULL,
  jsonb_build_object(
    'name', product.name,
    'categoryId', product.category_id,
    'sellingPrice', product.selling_price,
    'baseHpp', product.base_hpp,
    'hasRecipe', product.has_recipe,
    'isActive', product.is_active,
    'imagePath', product.image_path
  ),
  product.created_at
FROM products AS product;

INSERT INTO audit_logs (
  user_id, action, entity, entity_id, before_data, after_data, created_at
)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  'update',
  'recipe',
  product.id,
  NULL,
  jsonb_build_object(
    'productName', product.name,
    'ingredientCount', count(recipe.id)
  ),
  product.updated_at
FROM products AS product
JOIN recipes AS recipe ON recipe.product_id = product.id
GROUP BY product.id, product.name, product.updated_at;

INSERT INTO audit_logs (
  user_id, action, entity, entity_id, before_data, after_data, created_at
)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  CASE WHEN app_user.username = 'kasir.lama' THEN 'update' ELSE 'create' END,
  'user',
  app_user.id,
  CASE
    WHEN app_user.username = 'kasir.lama' THEN jsonb_build_object('isActive', true)
    ELSE NULL
  END,
  jsonb_build_object(
    'name', app_user.name,
    'username', app_user.username,
    'role', app_user.role,
    'isActive', app_user.is_active,
    'sessionVersion', app_user.session_version
  ),
  app_user.updated_at
FROM users AS app_user;

-- ---------------------------------------------------------------------------
-- 6. VALIDASI REKONSILIASI — SEMUA HARUS LULUS SEBELUM COMMIT
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  invalid_count integer;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM ingredients AS ingredient
  LEFT JOIN (
    SELECT
      ingredient_id,
      round(sum(CASE WHEN type = 'in' THEN quantity ELSE -quantity END), 3) AS ledger_stock
    FROM stock_transactions
    GROUP BY ingredient_id
  ) AS ledger ON ledger.ingredient_id = ingredient.id
  WHERE ingredient.current_stock <> coalesce(ledger.ledger_stock, 0);

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validasi gagal: % saldo stok tidak cocok dengan ledger.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM ingredients AS ingredient
  JOIN LATERAL (
    SELECT balance_after, value_after
    FROM stock_transactions
    WHERE ingredient_id = ingredient.id
    ORDER BY transaction_date DESC, id DESC
    LIMIT 1
  ) AS latest ON true
  WHERE ingredient.current_stock <> latest.balance_after
     OR ingredient.stock_value <> latest.value_after;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validasi gagal: % saldo bahan berbeda dari snapshot ledger terakhir.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM purchases AS purchase
  JOIN (
    SELECT purchase_id, sum(subtotal) AS detail_total
    FROM purchase_details
    GROUP BY purchase_id
  ) AS detail ON detail.purchase_id = purchase.id
  WHERE purchase.total_amount <> detail.detail_total;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validasi gagal: % total pembelian tidak cocok dengan detail.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM sales
  WHERE net_amount <> subtotal_amount - discount_amount
     OR total_amount <> net_amount + tax_amount
     OR gross_profit <> net_amount - total_hpp;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validasi gagal: % transaksi penjualan melanggar rumus finansial.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM cashier_shifts AS shift
  WHERE shift.status = 'closed'
    AND shift.expected_cash <> (
      shift.opening_cash
      + coalesce((
          SELECT sum(sale.total_amount)
          FROM sales AS sale
          WHERE sale.shift_id = shift.id
            AND sale.payment_method = 'cash'
            AND sale.status = 'completed'
        ), 0)
      - coalesce((
          SELECT sum(expense.amount)
          FROM operational_expenses AS expense
          WHERE expense.cashier_shift_id = shift.id
        ), 0)
    );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validasi gagal: % rekonsiliasi shift tidak cocok.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM operational_expenses AS expense
  JOIN stock_transactions AS movement ON movement.id = expense.stock_transaction_id
  WHERE movement.source <> 'waste'
     OR movement.type <> 'out'
     OR expense.amount <> movement.total_cost;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validasi gagal: relasi waste dan OPEX tidak konsisten.';
  END IF;

  IF (SELECT count(*) FROM cashier_shifts WHERE status = 'open') <> 1 THEN
    RAISE EXCEPTION 'Validasi gagal: dataset harus memiliki tepat satu shift terbuka.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales WHERE status = 'voided') THEN
    RAISE EXCEPTION 'Validasi gagal: contoh void tidak terbentuk.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales_details WHERE hpp_source = 'fallback') THEN
    RAISE EXCEPTION 'Validasi gagal: contoh HPP fallback tidak terbentuk.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales_details WHERE hpp_source = 'base') THEN
    RAISE EXCEPTION 'Validasi gagal: contoh HPP base tidak terbentuk.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales_details WHERE hpp_source = 'recipe') THEN
    RAISE EXCEPTION 'Validasi gagal: contoh HPP recipe tidak terbentuk.';
  END IF;
END;
$$;

COMMIT;

-- ---------------------------------------------------------------------------
-- 7. HASIL RINGKAS — RESULT SET UNTUK PENGECEKAN SETELAH RUN
-- ---------------------------------------------------------------------------

SELECT 'users' AS entity, count(*)::bigint AS row_count FROM users
UNION ALL SELECT 'product_categories', count(*) FROM product_categories
UNION ALL SELECT 'ingredients', count(*) FROM ingredients
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'recipes', count(*) FROM recipes
UNION ALL SELECT 'purchases', count(*) FROM purchases
UNION ALL SELECT 'stock_transactions', count(*) FROM stock_transactions
UNION ALL SELECT 'cashier_shifts', count(*) FROM cashier_shifts
UNION ALL SELECT 'sales', count(*) FROM sales
UNION ALL SELECT 'sales_details', count(*) FROM sales_details
UNION ALL SELECT 'operational_expenses', count(*) FROM operational_expenses
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
ORDER BY entity;

SELECT
  count(*) FILTER (WHERE status = 'completed') AS transaksi_selesai,
  count(*) FILTER (WHERE status = 'voided') AS transaksi_void,
  coalesce(sum(net_amount) FILTER (WHERE status = 'completed'), 0) AS pendapatan_bersih,
  coalesce(sum(total_hpp) FILTER (WHERE status = 'completed'), 0) AS hpp,
  coalesce(sum(gross_profit) FILTER (WHERE status = 'completed'), 0) AS laba_kotor,
  (SELECT coalesce(sum(amount), 0) FROM operational_expenses) AS beban_operasional,
  coalesce(sum(gross_profit) FILTER (WHERE status = 'completed'), 0)
    - (SELECT coalesce(sum(amount), 0) FROM operational_expenses) AS laba_bersih
FROM sales;

SELECT
  ingredient.name,
  ingredient.current_stock,
  ingredient.unit,
  ingredient.minimum_stock,
  ingredient.average_cost,
  ingredient.stock_value
FROM ingredients AS ingredient
WHERE ingredient.is_active = true
ORDER BY
  (ingredient.current_stock <= ingredient.minimum_stock) DESC,
  ingredient.name;

-- SIMPAN HASIL INI. Password hanya muncul pada session seed dan tidak disimpan plaintext.
SELECT role_label, username, generated_password
FROM _merbaoe_seed_credentials
ORDER BY username;
