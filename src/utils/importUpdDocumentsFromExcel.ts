import * as XLSX from 'xlsx';
import { UpdDocument } from '../types';

// Helper to parse date from various Excel formats
const parseExcelDate = (excelDateValue: any): string | null => {
  if (typeof excelDateValue === 'number') {
    // If it's a number, it's likely an Excel date serial number
    const date = XLSX.SSF.parse_date_code(excelDateValue);
    if (date) {
      // Construct a Date object from parsed components
      const jsDate = new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
      return jsDate.toISOString();
    }
  } else if (typeof excelDateValue === 'string') {
    // Try to parse common string formats
    const dateParts = excelDateValue.match(/(\d{2})\.(\d{2})\.(\d{4})\s*(\d{2}):(\d{2}):(\d{2})/);
    if (dateParts) {
      // DD.MM.YYYY HH:MM:SS
      const [, day, month, year, hour, minute, second] = dateParts.map(Number);
      const jsDate = new Date(year, month - 1, day, hour, minute, second);
      if (!isNaN(jsDate.getTime())) {
        return jsDate.toISOString();
      }
    }
    // Fallback for other string formats that Date.parse might handle
    const jsDate = new Date(excelDateValue);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString();
    }
  }
  return null;
};

export const importUpdDocumentsFromExcel = async (file: File): Promise<UpdDocument[]> => {
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
          date: getColumnIndex(['Дата', 'Date']),
          document: getColumnIndex(['Документ', 'Document', 'Document Name']),
          counterparty: getColumnIndex(['Контрагент', 'Counterparty', 'Counterparty Name']),
          contract: getColumnIndex(['Договор', 'Contract']), // Добавлено поле Договор
        };
        
        const requiredFields = ['document', 'counterparty'];
        const missingFields = requiredFields.filter(field => columnIndices[field as keyof typeof columnIndices] === -1);
        
        if (missingFields.length > 0) {
          throw new Error(`Не найдены обязательные столбцы: ${missingFields.join(', ')}`);
        }
        
        const documents: UpdDocument[] = [];
        
        rows.forEach((row, index) => {
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

          const documentDateValue = getValue(columnIndices.date);
          const parsedDate = parseExcelDate(documentDateValue);
          
          const document: UpdDocument = {
            id: `temp-${Date.now()}-${index}`, // Временный ID
            created_at: new Date().toISOString(), // Будет перезаписано Supabase
            counterparty_name: getStringValue(columnIndices.counterparty),
            document_name: getStringValue(columnIndices.document),
            document_date: parsedDate,
            contract: getStringValue(columnIndices.contract, null), // Получаем значение договора
            is_active: true,
          };
          
          if (!document.document_name || !document.counterparty_name) {
            console.warn(`Пропущена строка ${index + 2} из-за отсутствия названия документа или контрагента.`);
            return;
          }
          
          documents.push(document);
        });
        
        if (documents.length === 0) {
          throw new Error('Не удалось импортировать ни одной записи документов УПД');
        }
        
        resolve(documents);
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
