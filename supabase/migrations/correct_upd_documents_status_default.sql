/*
  # Correct status column default and existing data

  1. Modified Tables
    - `upd_documents`
      - Removed default value from `status` column.
      - Set `status` to NULL for all existing rows that currently have 'В работе'.
  2. Changes
    - The previous migration incorrectly applied 'В работе' as a default to all existing rows. This migration corrects that by removing the default and nullifying existing 'В работе' statuses for old documents.
    - New documents created via the application will continue to have 'В работе' status explicitly set.
*/

-- Remove the default value from the status column
ALTER TABLE upd_documents ALTER COLUMN status DROP DEFAULT;

-- Set the status of all documents that currently have 'В работе' to NULL.
-- This will revert the unintended application of the default to existing documents.
-- New documents created by the application will explicitly set the 'В работе' status.
UPDATE upd_documents
SET status = NULL
WHERE status = 'В работе';
