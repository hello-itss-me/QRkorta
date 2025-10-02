/*
  # Добавление столбца income_expense_type в таблицу saved_position_items

  1. Изменения в таблицах
    - `saved_position_items`
      - Добавлен столбец `income_expense_type` (text, NOT NULL, DEFAULT '') для хранения типа дохода/расхода элемента.
  */

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'income_expense_type'
  ) THEN
    ALTER TABLE saved_position_items ADD COLUMN income_expense_type text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Обновление существующих строк для заполнения income_expense_type из item_data, если оно пустое
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'income_expense_type'
  ) THEN
    UPDATE saved_position_items
    SET income_expense_type = item_data->>'type'
    WHERE income_expense_type = '' AND item_data IS NOT NULL AND item_data->>'type' IS NOT NULL;
  END IF;
END $$;
