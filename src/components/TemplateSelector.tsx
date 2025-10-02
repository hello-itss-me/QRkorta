import React, { useState, useEffect, useCallback } from 'react';
import { getTemplates, getTemplateItems, deleteTemplate } from '../utils/supabaseExport';
import { Template, RepairItem, Position } from '../types';
import { Loader, Trash2, Edit, X, AlertTriangle, LayoutTemplate, Search } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (positions: Position[], unallocatedItems: RepairItem[]) => void;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
    } catch (err) {
      setError('Не удалось загрузить шаблоны.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (templateId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон? Это действие необратимо.')) {
      setDeletingId(templateId);
      try {
        const success = await deleteTemplate(templateId);
        if (success) {
          await fetchTemplates(); // Re-fetch all templates to update the list
        } else {
          alert('Не удалось удалить шаблон.');
        }
      } catch (err) {
        alert('Произошла ошибка при удалении.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSelectTemplate = async (template: Template) => {
    if (window.confirm('Загрузка шаблона приведет к потере текущей работы. Продолжить?')) {
      setLoadingTemplateId(template.id);
      try {
        const itemsData = await getTemplateItems(template.id);
        if (!itemsData || itemsData.length === 0) {
          throw new Error('Элементы для этого шаблона не найдены.');
        }

        // Group items by their original_position_id
        const groupedByOriginalPosition: { [key: string]: { serviceName: string, items: RepairItem[] } } = {};
        itemsData.forEach(templateItem => {
          const originalPosId = templateItem.original_position_id;
          const originalServiceName = templateItem.original_service_name;
          const item = templateItem.item_data;

          if (originalPosId && originalServiceName) {
            if (!groupedByOriginalPosition[originalPosId]) {
              groupedByOriginalPosition[originalPosId] = {
                serviceName: originalServiceName,
                items: []
              };
            }
            groupedByOriginalPosition[originalPosId].items.push(item);
          } else {
            // Fallback for old templates or items without original_position_id
            // This will still split them, but new templates will be correct.
            console.warn('Template item missing original_position_id or original_service_name:', templateItem);
            const newId = `template-uncategorized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            groupedByOriginalPosition[newId] = {
              serviceName: item.positionName.split('_ID_')[0] || 'Некатегоризированная услуга',
              items: [item]
            };
          }
        });

        const newPositions: Position[] = Object.entries(groupedByOriginalPosition).map(([originalPosId, data], index) => {
          const items = data.items;
          const serviceName = data.serviceName;

          const totalPrice = items.reduce((sum, item) => sum + item.revenue, 0);
          const totalIncome = items
            .filter(item => item.incomeExpenseType === 'Доходы')
            .reduce((sum, item) => sum + item.revenue, 0);
          const totalExpense = items
            .filter(item => item.incomeExpenseType === 'Расходы')
            .reduce((sum, item) => sum + Math.abs(item.revenue), 0);

          return {
            id: `template-loaded-pos-${originalPosId}-${Date.now()}`, // Use a new ID for the loaded position
            service: serviceName,
            positionNumber: index + 1, // Re-number positions sequentially
            items: items,
            totalPrice,
            totalIncome,
            totalExpense,
          };
        });

        // Sort positions by their new sequential position number
        newPositions.sort((a, b) => a.positionNumber - b.positionNumber);

        onSelect(newPositions, []); // Templates typically load into positions, unallocated is empty
        onClose(); // Close the selector after selection
      } catch (err) {
        alert(`Не удалось загрузить шаблон: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        console.error(err);
      } finally {
        setLoadingTemplateId(null);
      }
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500">
          <Loader className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Загрузка шаблонов...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <AlertTriangle className="w-8 h-8 mb-2" />
          <p className="text-sm font-semibold">Ошибка</p>
          <p className="text-xs">{error}</p>
        </div>
      );
    }

    if (filteredTemplates.length === 0 && searchQuery.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Search className="w-8 h-8 mb-2" />
          <p className="text-sm font-semibold">Ничего не найдено</p>
          <p className="text-xs">Попробуйте изменить поисковый запрос.</p>
        </div>
      );
    }

    if (filteredTemplates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <LayoutTemplate className="w-8 h-8 mb-2" />
          <p className="text-sm font-semibold">Шаблоны отсутствуют</p>
          <p className="text-xs">Сохраните текущую работу как шаблон, чтобы она появилась здесь.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 truncate" title={template.name}>
              {template.name}
            </h3>
            {template.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2" title={template.description}>
                {template.description}
              </p>
            )}
            <p className="text-3xs text-gray-500 mb-3">
              Создан: {new Date(template.created_at).toLocaleString('ru-RU')}
            </p>
            <div className="flex justify-end space-x-2 mt-auto">
              <button
                onClick={() => handleSelectTemplate(template)}
                disabled={loadingTemplateId === template.id || deletingId !== null}
                className="flex items-center space-x-1 text-xxs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
              >
                {loadingTemplateId === template.id ? <Loader className="w-3 h-3 animate-spin" /> : <Edit className="w-3 h-3" />}
                <span>{loadingTemplateId === template.id ? 'Загрузка...' : 'Выбрать'}</span>
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                disabled={deletingId === template.id || loadingTemplateId !== null}
                className="flex items-center space-x-1 text-xxs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
              >
                {deletingId === template.id ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                <span>{deletingId === template.id ? 'Удаление...' : 'Удалить'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-1">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-2 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-base font-bold text-gray-800">Выбор шаблона</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </header>
        <div className="p-2 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или описанию шаблона..."
              className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-3">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default TemplateSelector;
