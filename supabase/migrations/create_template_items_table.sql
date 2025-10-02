/*
  # Create template_items table

  1. New Tables
    - `template_items`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `template_id` (uuid, foreign key to templates.id, not null)
      - `position_number` (int, not null)
      - `service` (text, not null)
      - `items_data` (jsonb, not null, stores array of RepairItem)
      - `total_price` (numeric, default 0)
      - `total_income` (numeric, default 0)
      - `total_expense` (numeric, default 0)
  2. Security
    - Enable RLS on `template_items` table
    - Add policies for authenticated users to manage items of their own templates
*/

CREATE TABLE IF NOT EXISTS template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  position_number int NOT NULL,
  service text NOT NULL,
  items_data jsonb NOT NULL,
  total_price numeric DEFAULT 0 NOT NULL,
  total_income numeric DEFAULT 0 NOT NULL,
  total_expense numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view template items of their own templates"
  ON template_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM templates WHERE id = template_id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert template items for their own templates"
  ON template_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM templates WHERE id = template_id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can delete template items for their own templates"
  ON template_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM templates WHERE id = template_id AND user_id = auth.uid())
  );
