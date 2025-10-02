/*
    # Alter template_items.original_position_id to TEXT

    1. Modified Tables
      - `template_items`
        - Alter `original_position_id` column type from `uuid` to `text`.
    2. Notes
      - This change is necessary because the application generates position IDs as strings (e.g., 'position-timestamp'),
        which are not valid UUIDs, causing 'invalid input syntax for type uuid' errors during template saving.
  */

  DO $$
  BEGIN
    -- Check if the column exists and its current type is uuid
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'template_items'
        AND column_name = 'original_position_id'
        AND data_type = 'uuid'
    ) THEN
      -- Alter the column type to text
      ALTER TABLE template_items ALTER COLUMN original_position_id TYPE text USING original_position_id::text;
    END IF;
  END $$;
