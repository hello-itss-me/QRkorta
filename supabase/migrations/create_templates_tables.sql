/*
    # Create templates and template_items tables

    1. New Tables
      - `templates`
        - `id` (uuid, primary key, default gen_random_uuid())
        - `created_at` (timestamptz, default now())
        - `user_id` (uuid, FK to auth.users, NOT NULL)
        - `name` (text, NOT NULL, unique per user)
        - `description` (text, nullable)
      - `template_items`
        - `id` (uuid, primary key, default gen_random_uuid())
        - `created_at` (timestamptz, default now())
        - `template_id` (uuid, FK to templates, NOT NULL)
        - `item_data` (jsonb, NOT NULL, stores RepairItem)
    2. Security
      - Enable RLS on `templates` table
      - Add policies for authenticated users to CRUD their own templates
      - Enable RLS on `template_items` table
      - Add policies for authenticated users to CRUD items belonging to their templates
    3. Indexes
      - Add index on `templates.user_id`
      - Add index on `template_items.template_id`
  */

  CREATE TABLE IF NOT EXISTS templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NULL,
    CONSTRAINT unique_template_name_for_user UNIQUE (user_id, name)
  );

  ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view their own templates"
    ON templates
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own templates"
    ON templates
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own templates"
    ON templates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own templates"
    ON templates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates (user_id);

  CREATE TABLE IF NOT EXISTS template_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    item_data jsonb NOT NULL
  );

  ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view template items for their templates"
    ON template_items
    FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM templates WHERE templates.id = template_items.template_id AND templates.user_id = auth.uid()));

  CREATE POLICY "Users can insert template items for their templates"
    ON template_items
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM templates WHERE templates.id = template_items.template_id AND templates.user_id = auth.uid()));

  CREATE POLICY "Users can update template items for their templates"
    ON template_items
    FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM templates WHERE templates.id = template_items.template_id AND templates.user_id = auth.uid()));

  CREATE POLICY "Users can delete template items for their templates"
    ON template_items
    FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM templates WHERE templates.id = template_items.template_id AND templates.user_id = auth.uid()));

  CREATE INDEX IF NOT EXISTS idx_template_items_template_id ON template_items (template_id);
