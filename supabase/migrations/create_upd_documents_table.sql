/*
      # Create upd_documents table

      1. New Tables
        - `upd_documents`
          - `id` (uuid, primary key, default gen_random_uuid())
          - `created_at` (timestamptz, default now())
          - `counterparty_name` (text, NOT NULL)
          - `document_name` (text, NOT NULL)
          - `is_active` (boolean, default true)
      2. Security
        - Enable RLS on `upd_documents` table
        - Add policy for authenticated users to read all active documents
    */

    CREATE TABLE IF NOT EXISTS upd_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      counterparty_name text NOT NULL,
      document_name text NOT NULL,
      is_active boolean DEFAULT true
    );

    ALTER TABLE upd_documents ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Authenticated users can view active UPD documents"
      ON upd_documents
      FOR SELECT
      TO authenticated
      USING (is_active = true);

    -- Optional: Policy for authenticated users to insert new documents
    CREATE POLICY "Authenticated users can insert UPD documents"
      ON upd_documents
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
