/*
    # Add original_position_id and original_service_name to template_items

    1. Modified Tables
      - `template_items`
        - Add `original_position_id` (uuid, nullable)
        - Add `original_service_name` (text, nullable)
    2. Notes
      - These columns will store the ID and service name of the position the item belonged to when the template was saved,
        allowing for correct reconstruction of positions upon loading a template.
  */

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'template_items' AND column_name = 'original_position_id'
    ) THEN
      ALTER TABLE template_items ADD COLUMN original_position_id uuid NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'template_items' AND column_name = 'original_service_name'
    ) THEN
      ALTER TABLE template_items ADD COLUMN original_service_name text NULL;
    END IF;
  END $$;
