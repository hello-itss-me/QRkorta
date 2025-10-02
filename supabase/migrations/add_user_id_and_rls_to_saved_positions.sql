/*
  # Add User Ownership and RLS to Saved Positions

  This migration introduces user ownership to the saved positions data, ensuring that users can only access and manage their own records.

  1.  **Schema Changes**
      -   Adds a `user_id` column to the `saved_positions` table.
      -   This column defaults to the currently authenticated user's ID (`auth.uid()`).
      -   It includes a foreign key constraint to `auth.users(id)` to maintain data integrity.

  2.  **Security (RLS)**
      -   Enables Row Level Security (RLS) on both `saved_positions` and `saved_position_items` tables.
      -   **`saved_positions` policies:**
          -   `Users can view their own saved positions.`: Allows users to `SELECT` their own records.
          -   `Users can create saved positions.`: Allows authenticated users to `INSERT` new records.
          -   `Users can update their own saved positions.`: Allows users to `UPDATE` their own records.
          -   `Users can delete their own saved positions.`: Allows users to `DELETE` their own records.
      -   **`saved_position_items` policies:**
          -   `Users can manage items for their own saved positions.`: A single policy that allows `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on items if the user owns the parent position. This is checked by looking up the `user_id` in the `saved_positions` table.
*/

-- 1. Add user_id to saved_positions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_positions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.saved_positions
    ADD COLUMN user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_saved_positions_user_id ON public.saved_positions(user_id);

-- 2. Enable RLS and create policies for saved_positions
ALTER TABLE public.saved_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved positions." ON public.saved_positions;
CREATE POLICY "Users can view their own saved positions."
ON public.saved_positions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create saved positions." ON public.saved_positions;
CREATE POLICY "Users can create saved positions."
ON public.saved_positions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved positions." ON public.saved_positions;
CREATE POLICY "Users can update their own saved positions."
ON public.saved_positions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved positions." ON public.saved_positions;
CREATE POLICY "Users can delete their own saved positions."
ON public.saved_positions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 3. Enable RLS and create policies for saved_position_items
ALTER TABLE public.saved_position_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage items for their own saved positions." ON public.saved_position_items;
CREATE POLICY "Users can manage items for their own saved positions."
ON public.saved_position_items FOR ALL
TO authenticated
USING (
  (SELECT sp.user_id FROM public.saved_positions sp WHERE sp.id = saved_position_items.position_id) = auth.uid()
)
WITH CHECK (
  (SELECT sp.user_id FROM public.saved_positions sp WHERE sp.id = saved_position_items.position_id) = auth.uid()
);
