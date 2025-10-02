/*
  # Add upd_status to saved_positions table

  1. Modified Tables
    - `saved_positions`
      - Added `upd_status` (text, nullable)
  2. Security
    - No changes to RLS policies.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_positions' AND column_name = 'upd_status'
  ) THEN
    ALTER TABLE saved_positions ADD COLUMN upd_status text;
  END IF;
END $$;
