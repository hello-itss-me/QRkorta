/*
  # Add contract column to upd_documents table

  1. Modified Tables
    - `upd_documents`
      - Added `contract` (text, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upd_documents' AND column_name = 'contract'
  ) THEN
    ALTER TABLE upd_documents ADD COLUMN contract text;
  END IF;
END $$;
