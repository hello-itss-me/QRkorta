/*
  # Add upd_status to saved_position_items table

  1. Modified Tables
    - `saved_position_items`
      - Added `upd_status` (text, nullable)
  2. Security
    - No changes to RLS policies.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'upd_status'
  ) THEN
    ALTER TABLE saved_position_items ADD COLUMN upd_status text;
  END IF;
END $$;
