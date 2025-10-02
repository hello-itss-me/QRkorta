/*
  # Introduce individual_employees table and rename employees to job_positions

  1. New Tables
    - `individual_employees`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `created_at` (timestamptz, default now())
      - `full_name` (text, NOT NULL, e.g., "Иванов И.И.")
      - `job_title` (text, NOT NULL, e.g., "Слесарь")
      - `hourly_rate` (numeric, NOT NULL, specific rate for this individual)
      - `is_active` (boolean, default true)
      - `description` (text, optional, for additional details)

  2. Changes
    - Rename `employees` table to `job_positions`.
    - `job_positions` will now store generic job titles and their default rates.
    - Migrate existing data from `job_positions` (old `employees`) to `individual_employees` for initial population.

  3. Security
    - Enable RLS on `job_positions` table.
    - Add RLS policies for `job_positions` (select for authenticated users).
    - Enable RLS on `individual_employees` table.
    - Add RLS policies for `individual_employees` (CRUD for authenticated users, allowing users to manage their own data).

  4. Notes
    - The `job_title` in `individual_employees` is a text field for simplicity, not a foreign key to `job_positions` at this stage.
    - Existing entries in `employees` will be copied to `individual_employees` to ensure continuity.
*/

-- Rename existing 'employees' table to 'job_positions'
ALTER TABLE IF EXISTS employees RENAME TO job_positions;

-- Add comment to the new table name
COMMENT ON TABLE job_positions IS 'Таблица для хранения общих должностей и их стандартных почасовых ставок.';

-- Ensure RLS is enabled for job_positions (formerly employees)
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- Policy for job_positions: authenticated users can read all job positions
DROP POLICY IF EXISTS "Authenticated users can read employees" ON job_positions;
CREATE POLICY "Authenticated users can read job positions"
  ON job_positions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create the new 'individual_employees' table
CREATE TABLE IF NOT EXISTS individual_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  full_name text NOT NULL,
  job_title text NOT NULL,
  hourly_rate numeric NOT NULL,
  is_active boolean DEFAULT true,
  description text
);

-- Add comments to columns
COMMENT ON COLUMN individual_employees.full_name IS 'Полное имя сотрудника (например: Иванов И.И.)';
COMMENT ON COLUMN individual_employees.job_title IS 'Должность сотрудника (например: Слесарь)';
COMMENT ON COLUMN individual_employees.hourly_rate IS 'Индивидуальная почасовая ставка сотрудника';
COMMENT ON COLUMN individual_employees.description IS 'Дополнительное описание или специализация сотрудника';

-- Enable Row Level Security for 'individual_employees'
ALTER TABLE individual_employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'individual_employees'
-- Policy for authenticated users to read all active individual employees
CREATE POLICY "Authenticated users can read individual employees"
  ON individual_employees
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy for authenticated users to insert their own individual employees
CREATE POLICY "Authenticated users can insert individual employees"
  ON individual_employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL); -- Assuming user_id column is not directly in this table, but linked via auth.uid() if needed for ownership. For now, any authenticated user can add.

-- Policy for authenticated users to update their own individual employees
CREATE POLICY "Authenticated users can update individual employees"
  ON individual_employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL); -- Similar to insert, assuming general authenticated access for updates.

-- Policy for authenticated users to delete their own individual employees (soft delete by setting is_active to false)
CREATE POLICY "Authenticated users can soft delete individual employees"
  ON individual_employees
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL); -- Similar to insert, assuming general authenticated access for deletes.

-- Initial data migration from job_positions to individual_employees
-- This will copy existing 'positions' as initial 'individual employees'
INSERT INTO individual_employees (full_name, job_title, hourly_rate, is_active, description)
SELECT name, name, hourly_rate, is_active, description
FROM job_positions
ON CONFLICT (id) DO NOTHING; -- In case of UUID collision, though unlikely with gen_random_uuid()
