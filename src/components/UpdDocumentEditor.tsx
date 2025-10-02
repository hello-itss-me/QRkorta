import React from 'react';
import { Edit } from 'lucide-react';

interface UpdDocumentEditorProps {
  document: string;
  onUpdate: (newDocument: string) => void;
  isEditable?: boolean; // New prop
}

const UpdDocumentEditor: React.FC<UpdDocumentEditorProps> = ({ document, onUpdate, isEditable = true }) => {
  const handleEditClick = () => {
    const newDocument = prompt('Введите новый документ УПД:', document);
    if (newDocument !== null) {
      onUpdate(newDocument);
    }
  };

  // Function to extract the desired part of the document name
  const getDisplayDocumentName = (fullDocumentName: string): string => {
    // Регулярное выражение для поиска паттерна "XXБП-В-РАБОТЕ от ДД.ММ.ГГГГ ЧЧ:ММ"
    // где XX - две цифры, ДД.ММ.ГГГГ - дата, ЧЧ:ММ - время
    const match = fullDocumentName.match(/(\d{2}БП-В-РАБОТЕ от \d{2}\.\d{2}\.\d{4} \d{2}:\d{2})/);
    if (match && match[1]) {
      return match[1];
    }
    // Если паттерн не найден, возвращаем исходный документ или его часть, если он слишком длинный
    // Для случая, когда документ не соответствует паттерну, но все равно нужно обрезать
    const prefix = "Реализация (акт, накладная, УПД) ";
    if (fullDocumentName.startsWith(prefix)) {
      return fullDocumentName.substring(prefix.length);
    }
    return fullDocumentName;
  };

  const displayDocument = getDisplayDocumentName(document);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-700">
      <span className="font-medium">Документ УПД:</span>
      <span className="flex-1 min-w-0 truncate">{displayDocument || 'Не указан'}</span>
      {isEditable && ( // Conditionally render edit icon
        <button onClick={handleEditClick} className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0">
          <Edit className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default UpdDocumentEditor;
