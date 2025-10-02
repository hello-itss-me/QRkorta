import * as XLSX from 'xlsx';
import { Counterparty } from '../types';

export const importCounterpartiesFromExcel = async (file: File): Promise<Counterparty[]> => {
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
        const rows = jsonData.slice(1) as any[][];
        
        const getColumnIndex = (possibleNames: string[]): number => {
          // Сначала ищем точные совпадения (без учета регистра)
          for (const name of possibleNames) {
            const exactIndex = headers.findIndex(h => 
              h && h.toString().toLowerCase().trim() === name.toLowerCase().trim()
            );
            if (exactIndex !== -1) {
              return exactIndex;
            }
          }
          
          // Затем ищем частичные совпадения
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
          inn: getColumnIndex(['ИНН', 'INN']),
          // Приоритет для 'Наименование в программе'
          name: getColumnIndex(['Наименование в программе', 'Полное наименование', 'Full Name', 'Name']),
          kpp: getColumnIndex(['КПП', 'KPP']),
          address: getColumnIndex(['Адрес', 'Address']),
          contactPerson: getColumnIndex(['Контактное лицо', 'Contact Person', 'Ответственный']),
          phone: getColumnIndex(['Телефон', 'Phone']),
          email: getColumnIndex(['Email', 'E-mail']),
          description: getColumnIndex(['Описание', 'Description', 'Метки']),
        };
        
        // Проверяем обязательные поля
        const requiredFields = ['name']; // ИНН может быть null
        const missingFields = requiredFields.filter(field => columnIndices[field as keyof typeof columnIndices] === -1);
        
        if (missingFields.length > 0) {
          throw new Error(`Не найдены обязательные столбцы: ${missingFields.join(', ')}`);
        }
        
        const counterparties: Counterparty[] = [];
        
        rows.forEach((row, index) => {
          // Пропускаем пустые строки
          if (!row || row.every(cell => !cell && cell !== 0)) {
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
          
          const counterparty: Counterparty = {
            id: `temp-${Date.now()}-${index}`, // Временный ID, Supabase сгенерирует реальный
            name: getStringValue(columnIndices.name),
            inn: getStringValue(columnIndices.inn, null),
            kpp: getStringValue(columnIndices.kpp, null),
            address: getStringValue(columnIndices.address, null),
            contact_person: getStringValue(columnIndices.contactPerson, null),
            phone: getStringValue(columnIndices.phone, null),
            email: getStringValue(columnIndices.email, null),
            description: getStringValue(columnIndices.description, null),
            is_active: true,
            created_at: new Date().toISOString(), // Будет перезаписано Supabase
            updated_at: new Date().toISOString(), // Будет перезаписано Supabase
          };
          
          // Базовая валидация для названия
          if (!counterparty.name) {
            console.warn(`Пропущена строка ${index + 2} из-за отсутствия названия контрагента.`);
            return;
          }
          
          counterparties.push(counterparty);
        });
        
        if (counterparties.length === 0) {
          throw new Error('Не удалось импортировать ни одной записи контрагентов');
        }
        
        resolve(counterparties);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsBinaryString(file);
  });
};
