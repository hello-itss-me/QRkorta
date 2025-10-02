import React, { useState, useMemo, useRef } from 'react';
import { Counterparty } from '../types';
import { useCounterparties } from '../hooks/useCounterparties';
import { Search, X, Loader2, AlertCircle, Building, Check, Upload } from 'lucide-react';
import { importCounterpartiesFromExcel } from '../utils/importCounterpartiesFromExcel';
import { supabase } from '../utils/supabaseClient';

interface CounterpartySelectorProps {
  onSelect: (counterparty: Counterparty) => void;
  onCancel: () => void;
}

export const CounterpartySelector: React.FC<CounterpartySelectorProps> = ({ onSelect, onCancel }) => {
  const { counterparties, loading, error, fetchCounterparties } = useCounterparties();
  const [selected, setSelected] = useState<Counterparty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCounterparties = useMemo(() => {
    if (!searchQuery.trim()) {
      return counterparties;
    }
    const query = searchQuery.toLowerCase().trim();
    return counterparties.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.inn && c.inn.includes(query)) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(query))
    );
  }, [counterparties, searchQuery]);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    let totalProcessed = 0;
    const failedCounterparties: { counterparty: Counterparty; error: string }[] = [];

    try {
      const importedData = await importCounterpartiesFromExcel(file);

      for (const counterparty of importedData) {
        try {
          let existingCounterparty: Counterparty | null = null;

          // 1. Попытка найти существующего контрагента по ИНН
          if (counterparty.inn && counterparty.inn.trim() !== '') {
            const { data: foundByInn, error: innSearchError } = await supabase
              .from('counterparties')
              .select('*') // Выбираем все поля, чтобы получить текущее состояние из БД
              .eq('inn', counterparty.inn)
              .single();

            if (innSearchError && innSearchError.code !== 'PGRST116') { // PGRST116 означает "строки не найдены"
              throw innSearchError;
            }

            if (foundByInn) {
              existingCounterparty = foundByInn;
            }
          }

          // 2. Если не найдено по ИНН, попытка найти по Наименованию
          if (!existingCounterparty && counterparty.name && counterparty.name.trim() !== '') {
            const { data: foundByName, error: nameSearchError } = await supabase
              .from('counterparties')
              .select('*') // Выбираем все поля, чтобы получить текущее состояние из БД
              .eq('name', counterparty.name)
              .single();

            if (nameSearchError && nameSearchError.code !== 'PGRST116') { // PGRST116 означает "строки не найдены"
              throw nameSearchError;
            }

            if (foundByName) {
              existingCounterparty = foundByName;
            }
          }

          // Подготавливаем данные для обновления/вставки
          // Приоритет данных из Excel, но с осторожностью к null ИНН
          const dataToSave = {
            name: counterparty.name, // Всегда берем имя из Excel
            inn: counterparty.inn,
            kpp: counterparty.kpp,
            address: counterparty.address,
            contact_person: counterparty.contact_person,
            phone: counterparty.phone,
            email: counterparty.email,
            description: counterparty.description,
            is_active: counterparty.is_active,
          };

          if (existingCounterparty) {
            // Если Excel INN пустой, но в БД есть валидный INN, сохраняем INN из БД.
            // В противном случае, INN из Excel имеет приоритет.
            if (!dataToSave.inn && existingCounterparty.inn) {
              dataToSave.inn = existingCounterparty.inn;
            }

            // Обновляем существующего контрагента
            const { error: updateError } = await supabase
              .from('counterparties')
              .update(dataToSave)
              .eq('id', existingCounterparty.id);

            if (updateError) {
              throw updateError;
            }
            totalProcessed++;
          } else {
            // Вставляем нового контрагента
            const { error: insertError } = await supabase
              .from('counterparties')
              .insert(dataToSave);

            if (insertError) {
              throw insertError;
            }
            totalProcessed++;
          }
        } catch (err: any) {
          console.error(`Не удалось обработать контрагента "${counterparty.name}" (ИНН: ${counterparty.inn || 'N/A'}):`, err);
          failedCounterparties.push({ counterparty, error: err.message || 'Неизвестная ошибка' });
        }
      }

      if (failedCounterparties.length > 0) {
        const errorMessages = failedCounterparties.map(f => `"${f.counterparty.name}" (ИНН: ${f.counterparty.inn || 'N/A'}): ${f.error}`);
        setUploadError(`Не удалось загрузить ${failedCounterparties.length} контрагентов из-за ошибок или дубликатов. Подробности: ${errorMessages.join('; ')}`);
      } else {
        alert(`Успешно загружено/обновлено ${totalProcessed} контрагентов.`);
      }
      
      fetchCounterparties(); // Обновляем список контрагентов
    } catch (err) {
      console.error('Ошибка при импорте Excel или загрузке в Supabase:', err);
      setUploadError(err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке Excel.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Очищаем input файла
      }
    }
  };

  const renderContent = () => {
    if (loading || isUploading) {
      return (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="ml-1.5 text-xs text-gray-600">
            {isUploading ? 'Загрузка контрагентов из Excel...' : 'Загрузка контрагентов...'}
          </span>
        </div>
      );
    }

    if (error || uploadError) {
      return (
        <div className="p-2">
          <div className="flex items-center text-red-600 mb-1.5">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span className="font-medium text-xs">Ошибка загрузки</span>
          </div>
          <p className="text-xxs text-gray-600">{error || uploadError}</p>
        </div>
      );
    }

    return (
      <>
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, ИНН, контакту..."
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="px-2 pb-2 space-y-1 max-h-[calc(95vh-160px)] overflow-y-auto">
          {filteredCounterparties.length > 0 ? (
            filteredCounterparties.map(c => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`
                  p-1.5 rounded-lg cursor-pointer transition-colors border-2
                  ${selected?.id === c.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-xxs text-gray-900">{c.name}</p>
                      {c.inn && <p className="text-3xs text-gray-500">ИНН: {c.inn}</p>}
                      {c.contact_person && <p className="text-3xs text-gray-500">Контакт: {c.contact_person}</p>}
                    </div>
                  </div>
                  {selected?.id === c.id && (
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-gray-500 text-xs">
              Контрагенты не найдены.
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[95vw] mx-3 flex flex-col max-h-[95vh]">
        <div className="p-2 border-b">
          <h3 className="text-base font-semibold text-gray-900">
            Выбор контрагента
          </h3>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          {renderContent()}
        </div>

        <div className="flex items-center justify-end space-x-1.5 p-2 border-t bg-gray-50">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || loading}
            className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-100 border border-blue-300 hover:bg-blue-200 rounded-md transition-colors flex items-center space-x-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <Upload className="w-3 h-3" />
            <span>Загрузка из Excel</span>
          </button>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="px-2.5 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            onClick={handleSelect}
            disabled={!selected || loading || isUploading}
            className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Выбрать
          </button>
        </div>
      </div>
    </div>
  );
};
