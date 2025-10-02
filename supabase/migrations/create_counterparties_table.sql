<pre>/*
  # Create counterparties table

  This migration creates a new table to store information about counterparties (clients, suppliers, etc.).

  1.  **New Table: `counterparties`**
      - `id`: UUID, Primary Key
      - `name`: TEXT, Not Null, Unique - The full name of the counterparty.
      - `inn`: TEXT, Unique - Taxpayer Identification Number (ИНН).
      - `kpp`: TEXT - Reason for Registration Code (КПП).
      - `address`: TEXT - Legal or physical address.
      - `contact_person`: TEXT - Name of the contact person.
      - `phone`: TEXT - Contact phone number.
      - `email`: TEXT - Contact email address.
      - `description`: TEXT - Additional notes or description.
      - `is_active`: BOOLEAN, Default `true` - Whether the counterparty is active.
      - `created_at`: TIMESTAMPTZ, Default `now()`
      - `updated_at`: TIMESTAMPTZ, Default `now()`

  2.  **Indexes**
      - A unique index is created on `name`.
      - A unique index is created on `inn` (for non-null values).
      - A standard index is created on `is_active`.

  3.  **Functions and Triggers**
      - Creates/replaces a function `handle_updated_at` to automatically update the `updated_at` timestamp on row changes.
      - Adds a trigger `on_counterparties_updated` to the `counterparties` table.

  4.  **Security**
      - Row Level Security (RLS) is enabled on the `counterparties` table.
      - A policy `Allow full access for authenticated users` is created, granting full CRUD access to authenticated users.
*/

-- 1. Create counterparties table
CREATE TABLE IF NOT EXISTS public.counterparties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inn TEXT,
  kpp TEXT,
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments to columns
COMMENT ON TABLE public.counterparties IS 'Stores information about business counterparties (clients, suppliers, etc.).';
COMMENT ON COLUMN public.counterparties.name IS 'The full name of the counterparty.';
COMMENT ON COLUMN public.counterparties.inn IS 'Taxpayer Identification Number (ИНН).';
COMMENT ON COLUMN public.counterparties.kpp IS 'Reason for Registration Code (КПП).';
COMMENT ON COLUMN public.counterparties.address IS 'Legal or physical address.';
COMMENT ON COLUMN public.counterparties.contact_person IS 'Name of the contact person.';
COMMENT ON COLUMN public.counterparties.phone IS 'Contact phone number.';
COMMENT ON COLUMN public.counterparties.email IS 'Contact email address.';
COMMENT ON COLUMN public.counterparties.description IS 'Additional notes or description.';
COMMENT ON COLUMN public.counterparties.is_active IS 'Whether the counterparty is active.';

-- 2. Add indexes for performance and constraints
CREATE UNIQUE INDEX IF NOT EXISTS counterparties_name_key ON public.counterparties (name);
CREATE UNIQUE INDEX IF NOT EXISTS counterparties_inn_key ON public.counterparties (inn) WHERE inn IS NOT NULL; -- Unique only for non-null values
CREATE INDEX IF NOT EXISTS counterparties_is_active_idx ON public.counterparties (is_active);

-- 3. Function and Trigger for updated_at
-- This function might already exist from other tables, so we use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_counterparties_updated ON public.counterparties;
CREATE TRIGGER on_counterparties_updated
  BEFORE UPDATE ON public.counterparties
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Enable RLS and set up policies
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow full access for authenticated users"
  ON public.counterparties
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
</pre>
