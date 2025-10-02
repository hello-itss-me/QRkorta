/*
      # Fix RLS Policies for Counterparties (v2)

      This migration corrects a syntax error in the previous RLS policy update for the `counterparties` table. It ensures public read access while restricting write operations to authenticated users.

      1.  **Policy Cleanup**
          - To ensure a clean state, this script first removes any policies that might have been created by previous attempts.

      2.  **Corrected Policies**
          - **`Allow read access for all users`**: A policy is created to allow `SELECT` operations for everyone (`anon` and `authenticated` roles). This makes the data publicly readable.
          - **`Allow full access for authenticated users`**: A second policy is created that allows `ALL` operations (`INSERT`, `UPDATE`, `DELETE`, `SELECT`) but only for the `authenticated` role.

      3.  **Security Impact**
          - Because RLS policies are permissive by default, these two policies combine correctly.
          - **Anonymous users** match only the first policy and can only `SELECT`.
          - **Authenticated users** match both policies and have full `ALL` access.
    */

    -- 1. Drop old policies to ensure a clean state.
    DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.counterparties;
    DROP POLICY IF EXISTS "Allow read access for all users" ON public.counterparties;
    DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.counterparties;


    -- 2. Create a policy to allow ANYONE (anonymous and authenticated) to READ counterparties.
    CREATE POLICY "Allow read access for all users"
      ON public.counterparties
      FOR SELECT
      TO anon, authenticated
      USING (true);

    -- 3. Create a policy that allows only AUTHENTICATED users to perform ALL actions.
    -- This works with the read policy above because policies are permissive.
    CREATE POLICY "Allow full access for authenticated users"
      ON public.counterparties
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
