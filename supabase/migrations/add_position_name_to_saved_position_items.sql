/*
  # Добавление столбца position_name в таблицу saved_position_items

  1. Изменения в таблицах
    - `saved_position_items`
      - Добавлен столбец `position_name` (text, NOT NULL, DEFAULT '') для хранения названия позиции элемента.
  */

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'position_name'
  ) THEN
    ALTER TABLE saved_position_items ADD COLUMN position_name text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Обновление существующих строк для заполнения position_name из item_data, если оно пустое
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'position_name'
  ) THEN
    UPDATE saved_position_items
    SET position_name = item_data->>'positionName'
    WHERE position_name = '' AND item_data IS NOT NULL AND item_data->>'positionName' IS NOT NULL;
  END IF;
END $$;
