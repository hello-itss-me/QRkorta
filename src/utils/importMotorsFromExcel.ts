import * as XLSX from 'xlsx';
import { Motor } from '../types';

export const importMotorsFromExcel = async (file: File): Promise<Omit<Motor, 'id' | 'created_at' | 'updated_at' | 'is_active'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          throw new Error('Файл должен содержать заголовки и данные');
        }

        const headers = jsonData[0] as string[];
        console.log('Excel Headers:', headers); // Log headers for debugging
        const rows = jsonData.slice(1) as any[][];

        const getColumnIndex = (possibleNames: string[]): number => {
          for (const name of possibleNames) {
            const exactIndex = headers.findIndex(h =>
              h && h.toString().toLowerCase().trim() === name.toLowerCase().trim()
            );
            if (exactIndex !== -1) {
              return exactIndex;
            }
          }
          for (const name of possibleNames) {
            const partialIndex = headers.findIndex(h =>
              h && h.toString().toLowerCase().includes(name.toLowerCase())
            );
            if (partialIndex !== -1) {
              return partialIndex;
            }
          }
          return -1;
        };

        const columnIndices = {
          name: getColumnIndex(['Двигатель_полное_название', 'Название', 'Наименование']),
          power_kw: getColumnIndex(['Мощность, кВт', 'Мощность']),
          rpm: getColumnIndex(['Обороты/об/мин', 'Обороты', 'RPM']),
          manufacturer: getColumnIndex(['Марка', 'Производитель']),
          voltage: getColumnIndex(['Напряжение', 'Voltage']),
          current: getColumnIndex(['Ток', 'Current']),
          efficiency: getColumnIndex(['КПД', 'Efficiency']),
          price_per_unit: getColumnIndex(['Цена за ед', 'Цена', 'Price'])
        };
        console.log('Column Indices:', columnIndices); // Log column indices for debugging

        const motors: Omit<Motor, 'id' | 'created_at' | 'updated_at' | 'is_active'>[] = [];

        rows.forEach((row, index) => {
          if (!row || row.every(cell => !cell && cell !== 0)) {
            console.warn(`Пропущена пустая строка ${index + 2}.`);
            return;
          }

          const getValue = (colIndex: number, defaultValue: any = null) => {
            if (colIndex === -1) return defaultValue;
            const value = row[colIndex];
            return value !== undefined && value !== null ? value : defaultValue;
          };

          const getStringValue = (colIndex: number, defaultValue: string = '') => {
            const value = getValue(colIndex, defaultValue);
            return value ? value.toString().trim() : defaultValue;
          };

          const getNumberValue = (colIndex: number, defaultValue: number | null = null) => {
            const value = getValue(colIndex, defaultValue);
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              const cleanValue = value.replace(',', '.');
              const parsed = parseFloat(cleanValue);
              return isNaN(parsed) ? defaultValue : parsed;
            }
            return defaultValue;
          };

          const motorName = getStringValue(columnIndices.name);
          const powerKw = getNumberValue(columnIndices.power_kw);
          const rpm = getNumberValue(columnIndices.rpm);

          // Пропускаем строки, если нет обязательных полей
          if (!motorName || powerKw === null || rpm === null) {
            console.warn(`Пропущена строка ${index + 2} из-за отсутствия обязательных полей (Название, Мощность, Обороты). Данные строки:`, row); // Log row data for skipped rows
            return;
          }

          motors.push({
            name: motorName,
            text: null,
            power_kw: powerKw,
            rpm: rpm,
            voltage: getNumberValue(columnIndices.voltage),
            current: getNumberValue(columnIndices.current),
            efficiency: getNumberValue(columnIndices.efficiency),
            price_per_unit: getNumberValue(columnIndices.price_per_unit, 0) || 0,
            manufacturer: getStringValue(columnIndices.manufacturer),
          });
        });

        if (motors.length === 0) {
          throw new Error('Не удалось импортировать ни одной записи о двигателях. Проверьте заголовки и данные в файле.');
        }
        console.log(`Successfully parsed ${motors.length} motors from Excel.`); // Log success

        resolve(motors);
      } catch (error) {
        console.error('Error in importMotorsFromExcel:', error); // Log the full error object
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };

    reader.readAsBinaryString(file);
  });
};
