/*
# Create service_records table

Stores each attended iPhone and its diagnostic outcome for the technician history screen.

1. New Tables
- `service_records`
  - `id` (uuid, primary key)
  - `attended_at` (timestamptz, when the service was registered)
  - `device_model` (text, model reported or typed by technician)
  - `serial_number` (text, nullable, when available)
  - `ios_version` (text, nullable, when available)
  - `connection_mode` (text, one of normal, recovery, dfu, unknown)
  - `diagnosis` (text, required summary of the diagnosis)
  - `procedures` (text[], list of procedures performed)
  - `notes` (text, nullable, free notes)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `service_records`.
- Single-tenant desktop app without sign-in, so policies target `anon` and `authenticated`.
- Policies are intentionally public within this installation.

3. Notes
- Index on `attended_at` for newest-first history queries.
- Table is created idempotently and safe to re-run.
*/

CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attended_at timestamptz NOT NULL DEFAULT now(),
  device_model text NOT NULL DEFAULT 'Não identificado',
  serial_number text,
  ios_version text,
  connection_mode text NOT NULL DEFAULT 'unknown'
    CHECK (connection_mode IN ('normal', 'recovery', 'dfu', 'unknown')),
  diagnosis text NOT NULL,
  procedures text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_records_attended_at_idx
  ON service_records (attended_at DESC);

ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON service_records TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_service_records" ON service_records;
CREATE POLICY "anon_select_service_records" ON service_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_service_records" ON service_records;
CREATE POLICY "anon_insert_service_records" ON service_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_service_records" ON service_records;
CREATE POLICY "anon_update_service_records" ON service_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_service_records" ON service_records;
CREATE POLICY "anon_delete_service_records" ON service_records FOR DELETE
  TO anon, authenticated USING (true);
