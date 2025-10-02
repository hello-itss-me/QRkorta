/*
      # Seed upd_documents table

      This migration populates the `upd_documents` table with some initial mock data for development and testing purposes.

      1.  **New Data**
          - Inserts 5 sample UPD documents with fictional data.
    */

    INSERT INTO public.upd_documents (counterparty_name, document_name, is_active)
    VALUES
      ('ООО "Ромашка"', 'Реализация (акт, накладная, УПД) 00БП-000862 от 11.12.2024 9:07:59', true),
      ('ИП Петров Петр Петрович', 'Акт выполненных работ №123 от 05.11.2024', true),
      ('АО "ТехноСтрой"', 'Счет-фактура №54321 от 20.10.2024', true),
      ('ООО "Логистик-Сервис"', 'Транспортная накладная №9876 от 01.12.2024', true),
      ('ООО "Креатив"', 'Договор оказания услуг №КР-001 от 15.09.2024', true);
