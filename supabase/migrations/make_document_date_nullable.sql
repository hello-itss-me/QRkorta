/*
  # Make document_date column nullable in upd_documents

  1. Modified Tables
    - `upd_documents`
      - Altered `document_date` to be nullable
*/

DO $$
BEGIN
  -- Check if the column exists and is currently NOT NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'upd_documents'
      AND column_name = 'document_date'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE upd_documents ALTER COLUMN document_date DROP NOT NULL;
  END IF;
END $$;
