/*
  # Create templates table

  1. New Tables
    - `templates`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `created_at` (timestamptz, default now())
      - `name` (text, unique, not null)
      - `description` (text, nullable)
      - `user_id` (uuid, foreign key to auth.users.id, not null)
  2. Security
    - Enable RLS on `templates` table
    - Add policies for authenticated users to manage their own templates
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  name text UNIQUE NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view their own templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
