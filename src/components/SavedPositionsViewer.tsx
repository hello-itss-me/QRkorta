import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSavedPositions, getSavedPositionItems, deleteSavedPosition } from '../utils/supabaseExport';
import { SavedPosition, RepairItem } from '../types';
import { Loader, Trash2, Edit, X, AlertTriangle, Archive, Building2, FileText, Search, QrCode } from 'lucide-react';
import QrCodeGeneratorModal from './QrCodeGeneratorModal'; // Импортируем новый компонент

interface SavedPositionsViewerProps {
  onEdit: (position: SavedPosition, items: RepairItem[]) => void;
  onEditDocumentGroup: (positions: SavedPosition[], allItems: RepairItem[][]) => void;
  onClose: () => void;
  onViewQrDetails: (positionId: string) => void; // Добавлено для просмотра деталей по QR
}

// Обновленный тип для группировки, включающий статус
type GroupedPositionsByStatus = Record<string, Record<string, Record<string, SavedPosition[]>>>;

const SavedPositionsViewer: React.FC<SavedPositionsViewerProps> = ({ onEdit, onEditDocumentGroup, onClose, onViewQrDetails }) => {
  const [allPositions, setAllPositions] = useState<SavedPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDocKey, setEditingDocKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModalPosition, setQrModalPosition] = useState<SavedPosition | null>(null); // Состояние для модального окна QR

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const positions = await getSavedPositions();
      setAllPositions(positions);
    } catch (err) {
      setError('Не удалось загрузить сохраненные позиции.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const groupedAndFilteredPositions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = allPositions.filter(pos => {
      const counterpartyMatch = (pos.counterparty_name || 'Без контрагента').toLowerCase().includes(query);
      const documentMatch = (pos.document_new || 'Без документа УПД').toLowerCase().includes(query);
      const serviceMatch = pos.service.toLowerCase().includes(query);
      const statusMatch = (pos.upd_status || 'УПД проведены').toLowerCase().includes(query); // Добавлено для поиска по статусу
      return counterpartyMatch || documentMatch || serviceMatch || statusMatch;
    });

    return filtered.reduce((acc, pos) => {
      const counterpartyKey = pos.counterparty_name || 'Без контрагента';
      const documentKey = pos.document_new || 'Без документа УПД';
      // Определяем ключ статуса: 'В работе' или 'УПД проведены'
      const statusKey = pos.upd_status === 'В работе' ? 'В работе' : 'УПД проведены';

      if (!acc[counterpartyKey]) {
        acc[counterpartyKey] = {};
      }
      if (!acc[counterpartyKey][statusKey]) { // Новый уровень для статуса
        acc[counterpartyKey][statusKey] = {};
      }
      if (!acc[counterpartyKey][statusKey][documentKey]) { // Группа документов под статусом
        acc[counterpartyKey][statusKey][documentKey] = [];
      }
      acc[counterpartyKey][statusKey][documentKey].push(pos);
      return acc;
    }, {} as GroupedPositionsByStatus); // Используем новый тип
  }, [allPositions, searchQuery]);

  const handleDelete = async (positionId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту позицию? Это действие необратимо.')) {
      setDeletingId(positionId);
      try {
        const success = await deleteSavedPosition(positionId);
        if (success) {
          await fetchPositions(); // Re-fetch all positions to update the list
        } else {
          alert('Не удалось удалить позицию.');
        }
      } catch (err) {
        alert('Произошла ошибка при удалении.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = async (position: SavedPosition) => {
    setEditingId(position.id);
    try {
      const itemsData = await getSavedPositionItems(position.id);
      if (!itemsData || itemsData.length === 0) {
        throw new Error('Элементы для этой позиции не найдены.');
      }
      const items = itemsData.map(item => item.item_data);
      onEdit(position, items);
    } catch (err) {
      alert(`Не удалось загрузить данные для редактирования: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error(err);
    } finally {
      setEditingId(null);
    }
  };

  const handleEditDocumentGroup = async (docKey: string, positionsInDoc: SavedPosition[]) => {
    if (editingId || deletingId) return;
    setEditingDocKey(docKey);
    try {
        const allItemsData = await Promise.all(
            positionsInDoc.map(p => getSavedPositionItems(p.id))
        );

        if (allItemsData.some(d => !d)) {
            throw new Error('Не удалось загрузить все элементы для группы.');
        }

        const allItems = allItemsData.map(itemsData => itemsData.map(item => item.item_data));
        
        onEditDocumentGroup(positionsInDoc, allItems);

    } catch (err) {
        alert(`Не удалось загрузить группу для редактирования: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        console.error(err);
    } finally {
        setEditingDocKey(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500">
          <Loader className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Загрузка архива...</p>
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

    if (Object.keys(groupedAndFilteredPositions).length === 0 && searchQuery.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Search className="w-8 h-8 mb-2" />
          <p className="text-sm font-semibold">Ничего не найдено</p>
          <p className="text-xs">Попробуйте изменить поисковый запрос.</p>
        </div>
      );
    }

    if (Object.keys(groupedAndFilteredPositions).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Archive className="w-8 h-8 mb-2" />
          <p className="text-sm font-semibold">Архив пуст</p>
          <p className="text-xs">Сохраненные позиции будут отображаться здесь.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(groupedAndFilteredPositions).map(([counterparty, statusGroups]) => (
          <div key={counterparty} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1.5 flex items-center">
              <Building2 className="w-4 h-4 mr-1 text-gray-500" />
              Контрагент: <span className="ml-1 font-medium text-blue-700">{counterparty}</span>
            </h3>
            <div className="space-y-3 pl-2"> {/* Увеличиваем отступ для групп статусов */}
              {Object.entries(statusGroups).map(([status, docGroups]) => (
                <div key={status} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 mt-2 mb-1.5 px-1 py-0.5 bg-gray-100 rounded-md border border-gray-200 flex items-center">
                    <Archive className="w-3 h-3 mr-1 text-gray-500" />
                    {status}
                  </h4>
                  <div className="space-y-2 pl-2"> {/* Отступ для групп документов под статусом */}
                    {Object.entries(docGroups).map(([document, positions]) => (
                      <div key={document}>
                        <div className="mb-1.5 p-1 bg-gray-100 rounded-md border border-gray-200 flex justify-between items-center">
                          <p className="text-xxs font-semibold text-gray-700 flex items-center flex-1 min-w-0">
                            <FileText className="w-3 h-3 mr-1 text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                              Документ УПД: <span className="ml-1 font-normal text-gray-600">{document}</span>
                            </span>
                          </p>
                          <button
                            onClick={() => handleEditDocumentGroup(document, positions)}
                            disabled={editingDocKey === document || deletingId !== null || editingId !== null}
                            className="flex items-center space-x-1 text-xxs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait transition-colors ml-2 flex-shrink-0"
                          >
                            {editingDocKey === document ? <Loader className="w-3 h-3 animate-spin" /> : <Edit className="w-3 h-3" />}
                            <span>{editingDocKey === document ? 'Загрузка...' : 'Редактировать все'}</span>
                          </button>
                        </div>
                        <div className="space-y-1.5 pl-4 border-l-2 border-dashed border-gray-300 ml-1 py-1">
                          {positions.map(pos => (
                            <div key={pos.id} className="bg-white p-1.5 rounded-lg border border-gray-200 flex items-center justify-between hover:border-blue-500 transition-colors duration-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate" title={pos.service}>
                                  Позиция №{pos.position_number}: {pos.service}
                                </p>
                                <div className="text-3xs text-gray-500 mt-0 flex items-center space-x-2 flex-wrap">
                                  <span>Сохранено: {new Date(pos.export_date).toLocaleString('ru-RU')}</span>
                                  <span>Элементов: <strong>{pos.items_count}</strong></span>
                                  <span>Доход: <strong className="text-green-600">{pos.total_income.toLocaleString('ru-RU')} ₽</strong></span>
                                  <span>Расход: <strong className="text-red-600">{pos.total_expense.toLocaleString('ru-RU')} ₽</strong></span>
                                  <span>Итого: <strong className="text-blue-600">{pos.total_price.toLocaleString('ru-RU')} ₽</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <button
                                  onClick={() => setQrModalPosition(pos)} // Открываем модальное окно QR
                                  disabled={deletingId === pos.id || editingId !== null || editingDocKey !== null}
                                  className="flex items-center justify-center text-xxs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Сгенерировать QR-код"
                                >
                                  <QrCode className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleEdit(pos)}
                                  disabled={editingId === pos.id || deletingId !== null || editingDocKey !== null}
                                  className="flex items-center space-x-1 text-xxs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
                                >
                                  {editingId === pos.id ? <Loader className="w-3 h-3 animate-spin" /> : <Edit className="w-3 h-3" />}
                                  <span>{editingId === pos.id ? 'Загрузка...' : 'Редактировать'}</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(pos.id)}
                                  disabled={deletingId === pos.id || editingId !== null || editingDocKey !== null}
                                  className="flex items-center space-x-1 text-xxs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
                                >
                                  {deletingId === pos.id ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  <span>{deletingId === pos.id ? 'Удаление...' : 'Удалить'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-1">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
        <header className="flex items-center justify-between p-2 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-base font-bold text-gray-800">Архив сохраненных позиций</h2>
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
              placeholder="Поиск по контрагенту, документу, статусу или позиции..."
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

      {qrModalPosition && (
        <QrCodeGeneratorModal
          position={qrModalPosition}
          onClose={() => setQrModalPosition(null)}
          baseUrl={window.location.origin} // Передаем базовый URL приложения
        />
      )}
    </div>
  );
};

export default SavedPositionsViewer;
