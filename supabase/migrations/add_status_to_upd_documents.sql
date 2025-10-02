/*
  # Add status column to upd_documents table

  1. Modified Tables
    - `upd_documents`
      - Added `status` (text, nullable, default 'В работе')
  2. Security
    - No new RLS policies needed for this column, existing table policies apply.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upd_documents' AND column_name = 'status'
  ) THEN
    ALTER TABLE upd_documents ADD COLUMN status text DEFAULT 'В работе';
  END IF;
END $$;
