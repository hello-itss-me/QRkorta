/*
  # Backfill user_id for Existing Saved Positions

  This is a one-time data migration to fix an issue where existing records in the `saved_positions` table have a `NULL` `user_id`.

  1.  **Problem**
      -   The previous migration added the `user_id` column with a default value, but this default only applies to *new* records.
      -   Existing records created before the migration have `user_id` as `NULL`.
      -   The Row Level Security (RLS) policies for deleting and updating require `auth.uid() = user_id`. This check fails when `user_id` is `NULL`, preventing users from managing their old records.

  2.  **Solution**
      -   This script updates all rows in `saved_positions` where `user_id` is currently `NULL`.
      -   It sets the `user_id` to the ID of the currently authenticated user (`auth.uid()`) who runs this query.
      -   This effectively assigns ownership of all old, "orphan" records to the user, allowing them to be managed correctly.
*/

UPDATE public.saved_positions
SET user_id = auth.uid()
WHERE user_id IS NULL;
