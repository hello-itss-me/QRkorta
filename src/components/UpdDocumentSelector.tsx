import React, { useState, useMemo, useRef } from 'react';
import { UpdDocument, Counterparty } from '../types';
import { useUpdDocuments } from '../hooks/useUpdDocuments';
import { Search, X, Loader2, AlertCircle, FileText, Check, Building2, CalendarDays, Upload, PlusCircle } from 'lucide-react';
import { PeriodSelectorModal } from './PeriodSelectorModal';
import { importUpdDocumentsFromExcel } from '../utils/importUpdDocumentsFromExcel';
import { supabase } from '../utils/supabaseClient';

interface UpdDocumentSelectorProps {
  onSelect: (document: UpdDocument) => void;
  onCancel: () => void;
  selectedCounterparty: Counterparty | null;
}

type StatusGroupedUpdDocuments = {
  'В работе': UpdDocument[];
  'УПД проведены': UpdDocument[];
};

// Helper to format date for display
const formatDate = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper to format date and time for document name
const formatDateTimeForDocumentName = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Helper to parse date from string (DD.MM.YYYY)
const parseDate = (dateString: string): Date | null => {
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    // Check if the parsed date is valid and matches the input parts
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }
  return null;
};

export const UpdDocumentSelector: React.FC<UpdDocumentSelectorProps> = ({ onSelect, onCancel, selectedCounterparty }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize start and end dates to cover the current year by default
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1); // January 1st of current year
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // December 31st of current year, end of day
  });

  // Передаем имя выбранного контрагента в хук
  const { updDocuments, loading, error, fetchUpdDocuments } = useUpdDocuments(
    startDate,
    endDate,
    selectedCounterparty ? selectedCounterparty.name : null
  );

  const groupedByStatusAndFilteredDocuments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = updDocuments.filter(doc =>
      doc.document_name.toLowerCase().includes(query) ||
      doc.counterparty_name.toLowerCase().includes(query) ||
      (doc.contract && doc.contract.toLowerCase().includes(query))
    );

    const result: StatusGroupedUpdDocuments = {
      'В работе': [],
      'УПД проведены': [],
    };

    filtered.forEach(doc => {
      if (doc.status === 'В работе') {
        result['В работе'].push(doc);
      } else {
        // Any other status or null goes to "УПД проведены"
        result['УПД проведены'].push(doc);
      }
    });

    // Sort documents within each group by document_date descending
    result['В работе'].sort((a, b) => new Date(b.document_date || 0).getTime() - new Date(a.document_date || 0).getTime());
    result['УПД проведены'].sort((a, b) => new Date(b.document_date || 0).getTime() - new Date(a.document_date || 0).getTime());

    return result;
  }, [updDocuments, searchQuery]);

  const [selected, setSelected] = useState<UpdDocument | null>(null);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  const handlePeriodSelect = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setShowPeriodModal(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseDate(e.target.value);
    setStartDate(date);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseDate(e.target.value);
    // Ensure end date is end of day
    if (date) {
      date.setHours(23, 59, 59, 999);
    }
    setEndDate(date);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    let totalProcessed = 0;
    const failedDocuments: { document: UpdDocument; error: string }[] = [];

    try {
      const importedData = await importUpdDocumentsFromExcel(file);

      for (const doc of importedData) {
        try {
          let existingDocument: UpdDocument | null = null;

          // Попытка найти существующий документ по комбинации document_name, counterparty_name, document_date и contract
          let query = supabase
            .from('upd_documents')
            .select('*')
            .eq('document_name', doc.document_name)
            .eq('counterparty_name', doc.counterparty_name);
          
          if (doc.document_date) {
            query = query.eq('document_date', doc.document_date);
          } else {
            query = query.is('document_date', null);
          }

          if (doc.contract) {
            query = query.eq('contract', doc.contract);
          } else {
            query = query.is('contract', null);
          }

          const { data: foundDoc, error: searchError } = await query.single();

          if (searchError && searchError.code !== 'PGRST116') { // PGRST116 означает "строки не найдены"
            throw searchError;
          }

          if (foundDoc) {
            existingDocument = foundDoc;
          }

          const dataToSave = {
            document_name: doc.document_name,
            counterparty_name: doc.counterparty_name,
            document_date: doc.document_date,
            contract: doc.contract,
            status: doc.status || null, // Используем статус из Excel или NULL, если не указан
            is_active: doc.is_active,
          };

          if (existingDocument) {
            // Обновляем существующий документ
            const { error: updateError } = await supabase
              .from('upd_documents')
              .update(dataToSave)
              .eq('id', existingDocument.id);

            if (updateError) {
              throw updateError;
            }
            totalProcessed++;
          } else {
            // Вставляем новый документ
            const { error: insertError } = await supabase
              .from('upd_documents')
              .insert(dataToSave);

            if (insertError) {
              throw insertError;
            }
            totalProcessed++;
          }
        } catch (err: any) {
          console.error(`Не удалось обработать документ "${doc.document_name}" (Контрагент: ${doc.counterparty_name}):`, err);
          failedDocuments.push({ document: doc, error: err.message || 'Неизвестная ошибка' });
        }
      }

      if (failedDocuments.length > 0) {
        const errorMessages = failedDocuments.map(f => `"${f.document.document_name}" (Контрагент: ${f.document.counterparty_name}): ${f.error}`);
        setUploadError(`Не удалось загрузить ${failedDocuments.length} документов УПД из-за ошибок или дубликатов. Подробности: ${errorMessages.join('; ')}`);
      } else {
        alert(`Успешно загружено/обновлено ${totalProcessed} документов УПД.`);
      }
      
      fetchUpdDocuments(); // Обновляем список документов
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

  const handleCreateNewUpd = async () => {
    if (!selectedCounterparty) {
      alert('Пожалуйста, выберите контрагента перед созданием нового УПД.');
      return;
    }

    const now = new Date();
    const documentName = `Реализация (акт, накладная, УПД) 00БП-В-РАБОТЕ от ${formatDateTimeForDocumentName(now)}`;
    const counterpartyName = selectedCounterparty.name;

    setIsUploading(true); // Используем тот же индикатор загрузки
    setUploadError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('upd_documents')
        .insert({
          document_name: documentName,
          counterparty_name: counterpartyName,
          document_date: now.toISOString(), // Сохраняем текущую дату и время
          contract: 'В работе', // Можно установить дефолтное значение
          status: 'В работе', // Устанавливаем статус "В работе"
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      alert(`Новый документ УПД "${documentName}" успешно создан.`);
      fetchUpdDocuments(); // Обновляем список документов
      setSelected(data); // Выбираем только что созданный документ
    } catch (err: any) {
      console.error('Ошибка при создании нового УПД:', err);
      setUploadError(err.message || 'Неизвестная ошибка при создании нового УПД.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderContent = () => {
    if (loading || isUploading) {
      return (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="ml-1.5 text-xs text-gray-600">
            {isUploading ? 'Загрузка документов УПД из Excel или создание нового...' : 'Загрузка документов УПД...'}
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

    const { 'В работе': inProgressDocs, 'УПД проведены': completedDocs } = groupedByStatusAndFilteredDocuments;

    const hasDocuments = inProgressDocs.length > 0 || completedDocs.length > 0;

    if (!hasDocuments) {
      return (
        <div className="text-center py-3 text-gray-500 text-xs">
          Документы УПД не найдены.
        </div>
      );
    }

    return (
      <div className="px-2 pb-2 space-y-4 max-h-[calc(95vh-220px)] overflow-y-auto">
        {inProgressDocs.length > 0 && (
          <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-800 mb-1 border-b border-gray-200 pb-1 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-gray-500" />
              В работе
            </h3>
            <div className="space-y-1 pl-1.5">
              {inProgressDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelected(doc)}
                  className={`
                    p-1 rounded-md cursor-pointer transition-colors border
                    ${selected?.id === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-1">
                      <FileText className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs text-gray-900">{doc.document_name}</p>
                        <p className="text-xxs text-gray-500">
                          Контрагент: {doc.counterparty_name}
                          {doc.document_date && (
                            <span className="ml-1">от {formatDate(new Date(doc.document_date))}</span>
                          )}
                          {doc.contract && (
                            <span className="ml-1">({doc.contract})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {selected?.id === doc.id && (
                      <Check className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedDocs.length > 0 && (
          <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-800 mb-1 border-b border-gray-200 pb-1 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-gray-500" />
              УПД проведены
            </h3>
            <div className="space-y-1 pl-1.5">
              {completedDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelected(doc)}
                  className={`
                    p-1 rounded-md cursor-pointer transition-colors border
                    ${selected?.id === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-1">
                      <FileText className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs text-gray-900">{doc.document_name}</p>
                        <p className="text-xxs text-gray-500">
                          Контрагент: {doc.counterparty_name}
                          {doc.document_date && (
                            <span className="ml-1">от {formatDate(new Date(doc.document_date))}</span>
                          )}
                          {doc.contract && (
                            <span className="ml-1">({doc.contract})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {selected?.id === doc.id && (
                      <Check className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-[95vw] mx-3 flex flex-col max-h-[95vh]">
        <div className="p-2 border-b">
          <h3 className="text-base font-semibold text-gray-900">
            Выбор документа УПД
          </h3>
        </div>
        
        {/* Period Selector and Counterparty Filter */}
        <div className="p-2 border-b flex items-center space-x-2">
          <span className="text-xs text-gray-600">Период:</span>
          <div className="relative w-28">
            <input
              type="text"
              value={formatDate(startDate)}
              onChange={handleStartDateChange}
              placeholder="ДД.ММ.ГГГГ"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-6"
            />
            {startDate && (
              <button
                onClick={() => setStartDate(null)}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-600">-</span>
          <div className="relative w-28">
            <input
              type="text"
              value={formatDate(endDate)}
              onChange={handleEndDateChange}
              placeholder="ДД.ММ.ГГГГ"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-6"
            />
            {endDate && (
              <button
                onClick={() => setEndDate(null)}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowPeriodModal(true)}
            className="p-1.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
            title="Выбрать период из списка"
          >
            <CalendarDays className="w-4 h-4 text-gray-500" />
          </button>

          {/* Display selected counterparty name */}
          {selectedCounterparty && (
            <div className="flex items-center space-x-1 ml-4 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedCounterparty.name}</span>
            </div>
          )}
        </div>

        {/* Search Bar and New UPD Button */}
        <div className="p-2 flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по контрагенту, документу или договору..."
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
          <button
            onClick={handleCreateNewUpd}
            disabled={!selectedCounterparty || isUploading || loading}
            className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-100 border border-blue-300 hover:bg-blue-200 rounded-md transition-colors flex items-center space-x-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            title="Создать новый документ УПД (в работе)"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Добавить УПД (в работе)</span>
          </button>
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

        {showPeriodModal && (
          <PeriodSelectorModal
            onSelectPeriod={handlePeriodSelect}
            onClose={() => setShowPeriodModal(false)}
            initialStartDate={startDate}
            initialEndDate={endDate}
          />
        )}
      </div>
    </div>
  );
};
