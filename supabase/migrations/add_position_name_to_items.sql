/*
  # Add position_name to saved_position_items

  This migration adds a `position_name` column to the `saved_position_items` table. This is to resolve a `not-null constraint` violation when saving position items. The column will store the service name of the parent position for easier reference and potential denormalization benefits.

  1.  **Schema Changes**
      -   Adds a `position_name` column of type `TEXT` to the `saved_position_items` table.
      -   The column is added with a `NOT NULL` constraint. To safely apply this to a table that might have existing rows, a temporary default value of `''` (empty string) is used and then immediately removed.

  2.  **Security**
      -   No changes to RLS policies are required.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'position_name'
  ) THEN
    -- Add the column with a default value to handle existing rows
    ALTER TABLE public.saved_position_items
    ADD COLUMN position_name TEXT NOT NULL DEFAULT '';

    -- Remove the default value as future inserts must provide it
    ALTER TABLE public.saved_position_items
    ALTER COLUMN position_name DROP DEFAULT;
  END IF;
END $$;
