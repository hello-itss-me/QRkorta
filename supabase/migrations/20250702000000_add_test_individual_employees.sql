/*
  # Add test data for individual_employees

  1. New Data
    - Inserts multiple individual employees into the `individual_employees` table.
    - Includes two 'Слесарь' entries with different names and hourly rates to demonstrate the new functionality.
    - Adds other diverse employee types for testing.
  */

INSERT INTO individual_employees (full_name, job_title, hourly_rate, is_active, description)
VALUES
  ('Иванов И.И.', 'Слесарь', 300, TRUE, 'Слесарь по ремонту электродвигателей'),
  ('Петров П.П.', 'Слесарь', 350, TRUE, 'Слесарь-наладчик'),
  ('Сидоров С.С.', 'Сварщик', 380, TRUE, 'Сварщик по металлоконструкциям'),
  ('Кузнецов К.К.', 'Токарь', 350, TRUE, 'Токарь по обработке деталей'),
  ('Михайлов М.М.', 'Электрик', 320, TRUE, 'Электромонтажные работы'),
  ('Алексеев А.А.', 'Обмотчик', 400, TRUE, 'Перемотка обмоток электродвигателей'),
  ('Федоров Ф.Ф.', 'Маляр', 250, TRUE, 'Покраска оборудования'),
  ('Григорьев Г.Г.', 'Инженер', 500, TRUE, 'Инженер-конструктор');
