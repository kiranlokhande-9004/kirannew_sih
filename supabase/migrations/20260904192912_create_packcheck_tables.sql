/*
# PackCheck — Create core tables, RLS, storage buckets, and seed data

1. New Tables
- `violations`: Stores compliance violations with geo-coordinates, severity, violation types, inspector info, and verification status.
- `citizen_complaints`: Stores citizen-submitted complaints with product/store info, MRP vs price charged, and AI verification status.
- `brands`: Stores brand compliance scores, violation counts, and inspection priority status.
- `scans`: Stores AI-powered label scan results including detected violations as JSONB and compliance verdict.

2. Security (RLS)
- All tables have RLS enabled.
- This is a no-auth (single-tenant) demo app — no sign-in screen.
- Policies allow `anon, authenticated` full CRUD on all tables because the data is intentionally public/shared for the demo.
- `USING (true)` / `WITH CHECK (true)` is documented as intentional for this public demo context.

3. Storage
- Creates two public storage buckets: `label-scans` and `complaint-photos`.
- Both buckets allow public read/write for the demo.

4. Seed Data
- 5 violation pins across Mumbai (Dadar, Dharavi, Andheri West, Bandra, Colaba) with exact coordinates.
- 8 brands with compliance scores matching the UI design.
- 4 sample citizen complaints with AI-verified statuses.

5. Important Notes
- All tables use `gen_random_uuid()` for primary keys.
- Timestamps default to `now()`.
- The `violations.violation_types` column is a text array.
- The `scans.violations_found` column is JSONB to store structured violation data from Gemini.
*/

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  brand text,
  location_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  violation_types text[] DEFAULT '{}',
  severity text NOT NULL DEFAULT 'minor',
  inspector_id text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  is_verified boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS citizen_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL,
  product_name text NOT NULL,
  store_name text,
  location text,
  violation_type text,
  mrp_on_label double precision,
  price_charged double precision,
  description text,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  category text,
  compliance_score integer NOT NULL DEFAULT 0,
  total_violations integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'compliant',
  last_checked timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text,
  manufacturer text,
  violations_found jsonb DEFAULT '[]',
  is_compliant boolean DEFAULT true,
  photo_url text,
  scanned_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- violations policies (public demo — anon + authenticated full CRUD)
DROP POLICY IF EXISTS "anon_select_violations" ON violations;
CREATE POLICY "anon_select_violations" ON violations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_violations" ON violations;
CREATE POLICY "anon_insert_violations" ON violations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_violations" ON violations;
CREATE POLICY "anon_update_violations" ON violations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_violations" ON violations;
CREATE POLICY "anon_delete_violations" ON violations FOR DELETE
  TO anon, authenticated USING (true);

-- citizen_complaints policies
DROP POLICY IF EXISTS "anon_select_complaints" ON citizen_complaints;
CREATE POLICY "anon_select_complaints" ON citizen_complaints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_complaints" ON citizen_complaints;
CREATE POLICY "anon_insert_complaints" ON citizen_complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_complaints" ON citizen_complaints;
CREATE POLICY "anon_update_complaints" ON citizen_complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_complaints" ON citizen_complaints;
CREATE POLICY "anon_delete_complaints" ON citizen_complaints FOR DELETE
  TO anon, authenticated USING (true);

-- brands policies
DROP POLICY IF EXISTS "anon_select_brands" ON brands;
CREATE POLICY "anon_select_brands" ON brands FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_brands" ON brands;
CREATE POLICY "anon_insert_brands" ON brands FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_brands" ON brands;
CREATE POLICY "anon_update_brands" ON brands FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_brands" ON brands;
CREATE POLICY "anon_delete_brands" ON brands FOR DELETE
  TO anon, authenticated USING (true);

-- scans policies
DROP POLICY IF EXISTS "anon_select_scans" ON scans;
CREATE POLICY "anon_select_scans" ON scans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scans" ON scans;
CREATE POLICY "anon_insert_scans" ON scans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scans" ON scans;
CREATE POLICY "anon_update_scans" ON scans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scans" ON scans;
CREATE POLICY "anon_delete_scans" ON scans FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('label-scans', 'label-scans', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-photos', 'complaint-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to upload and read
DROP POLICY IF EXISTS "anon_upload_label_scans" ON storage.objects;
CREATE POLICY "anon_upload_label_scans" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'label-scans');

DROP POLICY IF EXISTS "anon_read_label_scans" ON storage.objects;
CREATE POLICY "anon_read_label_scans" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'label-scans');

DROP POLICY IF EXISTS "anon_upload_complaint_photos" ON storage.objects;
CREATE POLICY "anon_upload_complaint_photos" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'complaint-photos');

DROP POLICY IF EXISTS "anon_read_complaint_photos" ON storage.objects;
CREATE POLICY "anon_read_complaint_photos" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'complaint-photos');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed violations (5 Mumbai pins)
INSERT INTO violations (product_name, brand, location_name, latitude, longitude, violation_types, severity, is_verified) VALUES
  ('Multiple Products', 'Various', 'Dadar Market', 19.0178, 72.8478, ARRAY['Missing MRP'], 'critical', true),
  ('Spice Products', 'Local Masala Co.', 'Dharavi', 19.0422, 72.8553, ARRAY['Wrong Unit'], 'critical', true),
  ('Expired Products', 'Various', 'Andheri West', 19.1197, 72.8468, ARRAY['Expired Product'], 'major', true),
  ('Bakery Items', 'Britannia', 'Bandra', 19.0544, 72.8402, ARRAY['Font Too Small'], 'major', true),
  ('Packaged Goods', 'Various', 'Colaba', 19.0223, 72.8343, ARRAY['Missing Batch No.'], 'minor', true)
ON CONFLICT DO NOTHING;

-- Seed brands (8 brands matching UI)
INSERT INTO brands (brand_name, category, compliance_score, total_violations, status) VALUES
  ('Haldiram''s', 'Snacks & Packaged Foods', 87, 2, 'compliant'),
  ('Britannia', 'Bakery & Dairy', 82, 3, 'compliant'),
  ('ITC Foods', 'Packaged Foods', 76, 4, 'compliant'),
  ('Priya Gold', 'Biscuits & Snacks', 54, 7, 'watchlist'),
  ('Local Masala Co.', 'Spices', 41, 9, 'watchlist'),
  ('Eastern Condiments', 'Spices & Pickles', 38, 11, 'priority'),
  ('Shree Traders', 'Grains & Pulses', 22, 14, 'priority'),
  ('Mehta & Sons', 'General Merchandise', 14, 18, 'priority')
ON CONFLICT DO NOTHING;

-- Seed citizen complaints (4 complaints matching UI)
INSERT INTO citizen_complaints (complaint_id, product_name, store_name, location, violation_type, mrp_on_label, price_charged, description, status) VALUES
  ('PCK-2847', 'Haldiram Aloo Bhujia 200g', 'Sharma Kirana Store', 'Dadar, Mumbai', 'MRP Overcharge', 35.00, 42.00, 'Store charging more than printed MRP', 'verified'),
  ('PCK-2846', 'Priya Gold Biscuits', 'Daily Needs Mart', 'Andheri West', 'Missing Info', 20.00, 20.00, 'No batch number on package', 'verified'),
  ('PCK-2845', 'Eastern Pickle 200g', 'Fresh Mart', 'Bandra', 'Wrong Unit', 45.00, 45.00, 'Weight printed in ounces instead of grams', 'pending'),
  ('PCK-2844', 'Local Masala Haldi 100g', 'Street Vendor #34', 'Dharavi', 'Expired Product', 15.00, 12.00, 'Product expired 2 months ago still on shelf', 'verified')
ON CONFLICT DO NOTHING;
