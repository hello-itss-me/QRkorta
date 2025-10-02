/*
      # Add document_new column to saved_position_items

      This migration adds a new column `document_new` to the `saved_position_items` table. This column will store the "Документ УПД" value from the application header for every item within a saved position, ensuring that this information is preserved upon export.

      1. Modified Tables
        - `saved_position_items`:
          - Added `document_new` (text, nullable): This new column will hold the document string.

      2. Security
        - No changes to RLS policies. The new column will inherit existing policies.
    */

    ALTER TABLE public.saved_position_items
    ADD COLUMN IF NOT EXISTS document_new TEXT;

    COMMENT ON COLUMN public.saved_position_items.document_new IS 'Stores the UPD document string from the application header for all items in a saved position.';
