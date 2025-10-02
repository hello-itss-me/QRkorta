/*
  # Create subdivisions table

  1. New Tables
    - `subdivisions`
      - `id` (uuid, primary key) - Unique identifier for the subdivision
      - `name` (text) - Name of the subdivision
      - `code` (text) - Optional code for the subdivision
      - `created_at` (timestamptz) - Timestamp when the subdivision was created
      - `user_id` (uuid) - Reference to the user who owns this subdivision

  2. Security
    - Enable RLS on `subdivisions` table
    - Add policy for authenticated users to read their own subdivisions
    - Add policy for authenticated users to insert their own subdivisions
    - Add policy for authenticated users to update their own subdivisions
    - Add policy for authenticated users to delete their own subdivisions
*/

CREATE TABLE IF NOT EXISTS subdivisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE subdivisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subdivisions"
  ON subdivisions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subdivisions"
  ON subdivisions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subdivisions"
  ON subdivisions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subdivisions"
  ON subdivisions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
