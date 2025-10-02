import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader, AlertTriangle, Archive, Building2, FileText, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { getSavedPositionById, getSavedPositionItems } from '../utils/supabaseExport';
import { SavedPosition, RepairItem } from '../types';

interface QrCodeDetailsViewerProps {
  positionId: string;
  onClose: () => void;
}

const QrCodeDetailsViewer: React.FC<QrCodeDetailsViewerProps> = ({ positionId, onClose }) => {
  const [position, setPosition] = useState<SavedPosition | null>(null);
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const savedPosition = await getSavedPositionById(positionId);
      if (!savedPosition) {
        throw new Error('Позиция не найдена.');
      }
      setPosition(savedPosition);

      const savedItems = await getSavedPositionItems(positionId);
      const repairItems = savedItems.map(item => item.item_data);
      setItems(repairItems);

    } catch (err) {
      setError(`Не удалось загрузить данные: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [positionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500">
          <Loader className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Загрузка данных...</p>
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

    if (!position) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Archive className="w-8 h-8 mb-2" />
          <p className="text-sm font-semibold">Позиция не найдена</p>
          <p className="text-xs">Возможно, она была удалена или ID неверен.</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h3 className="text-base font-bold text-blue-800 mb-2 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            Позиция №{position.position_number}: {position.service}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
            <p className="flex items-center"><Building2 className="w-4 h-4 mr-1 text-gray-500" /> Контрагент: <span className="ml-1 font-medium text-blue-700">{position.counterparty_name || 'Не указан'}</span></p>
            <p className="flex items-center"><FileText className="w-4 h-4 mr-1 text-gray-500" /> Документ УПД: <span className="ml-1 font-medium text-blue-700">{position.document_new || 'Не указан'}</span></p>
            <p className="flex items-center">Статус УПД: <span className={`ml-1 font-medium ${position.upd_status === 'В работе' ? 'text-orange-600' : 'text-green-600'}`}>{position.upd_status || 'Неизвестен'}</span></p>
            <p>Сохранено: {new Date(position.export_date).toLocaleString('ru-RU')}</p>
            <p className="flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-green-600" /> Доход: <strong className="text-green-600">{position.total_income.toLocaleString('ru-RU')} ₽</strong></p>
            <p className="flex items-center"><TrendingDown className="w-4 h-4 mr-1 text-red-600" /> Расход: <strong className="text-red-600">{position.total_expense.toLocaleString('ru-RU')} ₽</strong></p>
            <p className="col-span-full text-lg font-bold text-blue-800">Итого: {position.total_price.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>

        <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">Элементы позиции ({items.length})</h4>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">Элементы для этой позиции не найдены.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-800">{index + 1}. {item.positionName}</p>
                <div className="text-xs text-gray-600 flex flex-wrap gap-x-3">
                  <span>Тип: {item.incomeExpenseType === 'Доходы' ? 'Доход' : 'Расход'}</span>
                  <span>Кол-во: {item.quantity}</span>
                  <span>Сумма: <strong className={item.incomeExpenseType === 'Доходы' ? 'text-green-600' : 'text-red-600'}>{item.revenue.toLocaleString('ru-RU')} ₽</strong></span>
                  {item.vatAmount > 0 && <span>НДС: {item.vatAmount.toLocaleString('ru-RU')} ₽</span>}
                </div>
                {item.analytics2 && <p className="text-xs text-gray-500 mt-1">Описание: {item.analytics2}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-1">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col">
        <header className="flex items-center justify-between p-2 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-base font-bold text-gray-800">Детали сохраненной позиции (QR-код)</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default QrCodeDetailsViewer;
