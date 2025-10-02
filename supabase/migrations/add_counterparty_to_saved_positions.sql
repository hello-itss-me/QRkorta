/*
        # Add counterparty relation to saved_positions

        This migration adds columns to the `saved_positions` table to link them to a counterparty, fixing a crash when saving positions.

        1.  **Modified Tables**
            - `saved_positions`:
              - Added `counterparty_id` (uuid): Foreign key referencing the `counterparties` table. Can be null.
              - Added `counterparty_name` (text): Stores the name of the counterparty for easier display. Can be null.

        2.  **Changes**
            - The `saved_positions` table can now be associated with a specific counterparty.
            - The foreign key constraint ensures data integrity. `ON DELETE SET NULL` is used so that deleting a counterparty doesn't delete the saved positions.
      */

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'saved_positions' AND column_name = 'counterparty_id'
        ) THEN
          ALTER TABLE public.saved_positions
          ADD COLUMN counterparty_id uuid;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'saved_positions' AND column_name = 'counterparty_name'
        ) THEN
          ALTER TABLE public.saved_positions
          ADD COLUMN counterparty_name text;
        END IF;
      END $$;

      -- Add foreign key constraint if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'saved_positions_counterparty_id_fkey'
        ) THEN
          ALTER TABLE public.saved_positions
          ADD CONSTRAINT saved_positions_counterparty_id_fkey
          FOREIGN KEY (counterparty_id)
          REFERENCES public.counterparties (id)
          ON DELETE SET NULL;
        END IF;
      END $$;
