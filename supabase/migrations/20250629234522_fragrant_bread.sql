/*
  # Add document column to saved_position_items table

  1. Changes
    - Add `document` column to `saved_position_items` table
    - Column type: TEXT (nullable)
    - Add index for better query performance
    - Column will store УПД document information

  2. Notes
    - This column stores document references like "Реализация (акт, накладная, УПД) 00БП-000862 от 11.12.2024 9:07:59"
    - Column is nullable to maintain compatibility with existing data
    - Index added for efficient filtering and searching by document
*/

-- Add document column to saved_position_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'document'
  ) THEN
    ALTER TABLE saved_position_items ADD COLUMN document TEXT;
    
    -- Add comment to describe the column purpose
    COMMENT ON COLUMN saved_position_items.document IS 'Документ УПД (например: Реализация (акт, накладная, УПД) 00БП-000862 от 11.12.2024 9:07:59)';
    
    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS saved_position_items_document_idx ON saved_position_items USING btree (document);
  END IF;
END $$;
