/*
  # Add subdivision reference to saved_positions

  1. Changes
    - Add `subdivision_id` column to `saved_positions` table
    - Add foreign key constraint to `subdivisions` table

  2. Notes
    - The column is nullable to allow positions without subdivisions
    - Uses ON DELETE SET NULL to preserve positions when subdivision is deleted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_positions' AND column_name = 'subdivision_id'
  ) THEN
    ALTER TABLE saved_positions ADD COLUMN subdivision_id uuid REFERENCES subdivisions(id) ON DELETE SET NULL;
  END IF;
END $$;
