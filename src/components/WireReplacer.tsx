import React, { useState, useMemo, useEffect } from 'react';
import { Wire, GroupedRepairItem } from '../types';
import { useWires } from '../hooks/useWires';
import { Loader2, AlertCircle, RussianRuble as Ruble, Search, X, Replace } from 'lucide-react';

interface WireReplacerProps {
  onSelect: (wire: Wire, length: number) => void;
  onCancel: () => void;
  currentItem: GroupedRepairItem;
}

export const WireReplacer: React.FC<WireReplacerProps> = ({
  onSelect,
  onCancel,
  currentItem,
}) => {
  const { wires, loading, error } = useWires();
  const [selectedWire, setSelectedWire] = useState<Wire | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [length, setLength] = useState(currentItem.quantity);

  useEffect(() => {
    setLength(currentItem.quantity);
  }, [currentItem]);

  const filteredWires = useMemo(() => {
    if (!searchQuery.trim()) {
      return wires;
    }
    const query = searchQuery.toLowerCase().trim();
    return wires.filter(wire =>
      wire.brand.toLowerCase().includes(query) ||
      wire.cross_section.toString().includes(query) ||
      wire.insulation_type.toLowerCase().includes(query)
    );
  }, [wires, searchQuery]);

  const handleSelectWire = () => {
    if (selectedWire && length > 0) {
      onSelect(selectedWire, length);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const wiresByBrand = filteredWires.reduce((acc, wire) => {
    const brand = wire.brand;
    if (!acc[brand]) {
      acc[brand] = [];
    }
    acc[brand].push(wire);
    return acc;
  }, {} as Record<string, Wire[]>);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка проводов...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Ошибка загрузки</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[700px] max-w-full mx-4 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Replace className="w-5 h-5 mr-2 text-blue-600" />
          Замена провода
        </h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-1">Текущий элемент:</p>
          <p className="text-sm font-semibold text-yellow-900">{currentItem.positionName}</p>
          <div className="flex items-center space-x-4 text-xs text-yellow-700 mt-1">
            <span>Длина: {currentItem.quantity} м</span>
            <span>Сумма: {Math.abs(currentItem.totalRevenue).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по марке, сечению..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите новый провод:
          </label>
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            {Object.keys(wiresByBrand).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery ? 'Ничего не найдено' : 'Нет доступных проводов'}
              </div>
            ) : (
              Object.entries(wiresByBrand).map(([brand, brandWires]) => (
                <div key={brand} className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">
                    {brand}
                  </h4>
                  <div className="space-y-1 pl-3">
                    {brandWires.map((wire) => (
                      <div
                        key={wire.id}
                        onClick={() => setSelectedWire(wire)}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors border-2
                          ${selectedWire?.id === wire.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {wire.brand} {wire.cross_section} мм²
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                              <span>{wire.insulation_type}</span>
                              <span>{wire.voltage_rating} В</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Ruble className="w-4 h-4 text-red-600" />
                              <span className="font-bold text-red-600">
                                {wire.price_per_meter.toLocaleString('ru-RU')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">за метр</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
                <label htmlFor="wire-length" className="text-sm font-medium text-gray-700">Длина (м):</label>
                <input
                    id="wire-length"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="0"
                />
            </div>
            <div className="flex items-center space-x-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={handleSelectWire}
                    disabled={!selectedWire || length <= 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    <Replace className="w-4 h-4" />
                    <span>Заменить</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
