/*
  # Добавление столбца "Документ" в таблицу saved_position_items

  1. Изменения
    - Добавляем столбец `document` в таблицу `saved_position_items`
    - Столбец будет содержать полную информацию о документе УПД
    - Тип данных: text с возможностью NULL (для совместимости с существующими записями)
    - Добавляем индекс для оптимизации поиска по документам

  2. Примечания
    - Столбец добавляется как nullable для совместимости с существующими данными
    - Индекс поможет быстро находить записи по документам
*/

-- Добавляем столбец для документа УПД
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_position_items' AND column_name = 'document'
  ) THEN
    ALTER TABLE saved_position_items ADD COLUMN document text;
  END IF;
END $$;

-- Создаем индекс для поиска по документам
CREATE INDEX IF NOT EXISTS saved_position_items_document_idx ON saved_position_items(document);

-- Добавляем комментарий к столбцу
COMMENT ON COLUMN saved_position_items.document IS 'Документ УПД (например: Реализация (акт, накладная, УПД) 00БП-000862 от 11.12.2024 9:07:59)';
