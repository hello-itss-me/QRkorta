/*
  # Создание таблицы для сохранения собранных позиций

  1. Новые таблицы
    - `saved_positions`
      - `id` (uuid, primary key)
      - `position_number` (integer) - номер позиции
      - `service` (text) - название услуги
      - `total_price` (decimal) - общая стоимость
      - `total_income` (decimal) - общие доходы
      - `total_expense` (decimal) - общие расходы
      - `items_count` (integer) - количество элементов в позиции
      - `export_date` (timestamp) - дата экспорта
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `saved_position_items`
      - `id` (uuid, primary key)
      - `position_id` (uuid, foreign key) - ссылка на позицию
      - `item_data` (jsonb) - полные данные элемента в JSON формате
      - `position_name` (text) - название позиции элемента
      - `revenue` (decimal) - выручка элемента
      - `quantity` (decimal) - количество
      - `income_expense_type` (text) - тип доходы/расходы
      - `work_type` (text) - статья работ
      - `salary_goods` (text) - категория зарплата/товары
      - `created_at` (timestamp)

  2. Безопасность
    - Включить RLS для обеих таблиц
    - Добавить политики для чтения, вставки и обновления
*/

-- Создаем таблицу сохраненных позиций
CREATE TABLE IF NOT EXISTS saved_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_number integer NOT NULL,
  service text NOT NULL,
  total_price decimal(15,2) NOT NULL DEFAULT 0,
  total_income decimal(15,2) NOT NULL DEFAULT 0,
  total_expense decimal(15,2) NOT NULL DEFAULT 0,
  items_count integer NOT NULL DEFAULT 0,
  export_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаем таблицу элементов сохраненных позиций
CREATE TABLE IF NOT EXISTS saved_position_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES saved_positions(id) ON DELETE CASCADE,
  item_data jsonb NOT NULL,
  position_name text NOT NULL,
  revenue decimal(15,2) NOT NULL DEFAULT 0,
  quantity decimal(10,2) NOT NULL DEFAULT 0,
  income_expense_type text NOT NULL,
  work_type text DEFAULT '',
  salary_goods text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS saved_positions_export_date_idx ON saved_positions(export_date DESC);
CREATE INDEX IF NOT EXISTS saved_position_items_position_id_idx ON saved_position_items(position_id);
CREATE INDEX IF NOT EXISTS saved_position_items_income_expense_type_idx ON saved_position_items(income_expense_type);
CREATE INDEX IF NOT EXISTS saved_position_items_work_type_idx ON saved_position_items(work_type);

-- Включаем RLS
ALTER TABLE saved_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_position_items ENABLE ROW LEVEL SECURITY;

-- Политики для saved_positions
CREATE POLICY "Anyone can read saved positions"
  ON saved_positions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert saved positions"
  ON saved_positions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update saved positions"
  ON saved_positions
  FOR UPDATE
  USING (true);

-- Политики для saved_position_items
CREATE POLICY "Anyone can read saved position items"
  ON saved_position_items
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert saved position items"
  ON saved_position_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update saved position items"
  ON saved_position_items
  FOR UPDATE
  USING (true);

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_saved_positions_updated_at
  BEFORE UPDATE ON saved_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
