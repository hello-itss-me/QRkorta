/*
  # Add income_expense_type to saved_position_items

  This migration adds an `income_expense_type` column to the `saved_position_items` table. This is to resolve a `not-null constraint` violation when saving position items. The column will store the income/expense type from the related RepairItem for easier querying and filtering.

  1.  **Schema Changes**
      -   Adds an `income_expense_type` column of type `TEXT` to the `saved_position_items` table.
      -   The column is added with a `NOT NULL` constraint. A temporary default value is used to handle existing rows.

  2.  **Security**
      -   No changes to RLS policies are required.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'income_expense_type'
  ) THEN
    -- Add the column with a default value to handle existing rows
    ALTER TABLE public.saved_position_items
    ADD COLUMN income_expense_type TEXT NOT NULL DEFAULT 'Доходы';

    -- Remove the default value as future inserts must provide it
    ALTER TABLE public.saved_position_items
    ALTER COLUMN income_expense_type DROP DEFAULT;
  END IF;
END $$;
