/*
  # Add document_date to upd_documents table

  1. Modified Tables
    - `upd_documents`
      - Added `document_date` (timestamptz, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upd_documents' AND column_name = 'document_date'
  ) THEN
    ALTER TABLE upd_documents ADD COLUMN document_date timestamptz;
  END IF;
END $$;
