/*
  # Add Header Data to Saved Positions

  This migration adds `counterparty_name` and `document_new` to the `saved_positions` table to optimize fetching for the archive view. This denormalizes the data slightly but avoids complex joins or multiple queries when displaying the archive.

  1. Modified Tables
    - `saved_positions`
      - Added `counterparty_name` (text, nullable): Stores the name of the counterparty.
      - Added `document_new` (text, nullable): Stores the UPD document details.
*/

ALTER TABLE public.saved_positions
ADD COLUMN IF NOT EXISTS counterparty_name TEXT,
ADD COLUMN IF NOT EXISTS document_new TEXT;
