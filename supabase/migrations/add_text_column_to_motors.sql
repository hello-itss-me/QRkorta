/*
  # Add 'text' column to motors table

  1. Modified Tables
    - `motors`
      - Added `text` (text, nullable, default null)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'motors' AND column_name = 'text'
  ) THEN
    ALTER TABLE motors ADD COLUMN text text DEFAULT NULL;
  END IF;
END $$;
