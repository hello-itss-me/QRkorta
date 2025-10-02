/*
  # Add counterparty to saved items

  This migration adds a new column to the `saved_position_items` table to store the name of the counterparty associated with the saved position item.

  1. Modified Tables
    - `saved_position_items`
      - Added `counterparty_name` (text, nullable): Stores the name of the counterparty.
*/

ALTER TABLE public.saved_position_items
ADD COLUMN IF NOT EXISTS counterparty_name TEXT;
