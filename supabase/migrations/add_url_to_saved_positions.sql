/*
  # Добавление столбца URL в таблицу saved_positions

  1. Изменения в таблицах
    - `saved_positions`
      - Добавлен столбец `url` (text, nullable) для хранения URL QR-кода позиции.
  */

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'saved_positions' AND column_name = 'url'
    ) THEN
      ALTER TABLE saved_positions ADD COLUMN url text;
    END IF;
  END $$;
