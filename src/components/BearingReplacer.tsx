import React, { useState, useMemo } from 'react';
import { Bearing, GroupedRepairItem } from '../types';
import { useBearings } from '../hooks/useBearings';
import { Circle, Loader2, AlertCircle, RussianRuble as Ruble, Ruler, Search, X, Replace } from 'lucide-react';

interface BearingReplacerProps {
  onSelect: (bearing: Bearing) => void;
  onCancel: () => void;
  currentItem: GroupedRepairItem;
}

export const BearingReplacer: React.FC<BearingReplacerProps> = ({
  onSelect,
  onCancel,
  currentItem,
}) => {
  const { bearings, loading, error } = useBearings();
  const [selectedBearing, setSelectedBearing] = useState<Bearing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBearings = useMemo(() => {
    if (!searchQuery.trim()) {
      return bearings;
    }
    const query = searchQuery.toLowerCase().trim();
    return bearings.filter(bearing =>
      bearing.designation.toLowerCase().includes(query) ||
      bearing.inner_diameter.toString().includes(query) ||
      bearing.outer_diameter.toString().includes(query) ||
      bearing.width.toString().includes(query) ||
      bearing.manufacturer.toLowerCase().includes(query)
    );
  }, [bearings, searchQuery]);

  const handleSelectBearing = () => {
    if (selectedBearing) {
      onSelect(selectedBearing);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const bearingsByDiameter = filteredBearings.reduce((acc, bearing) => {
    const diameterGroup = `Ø${bearing.inner_diameter} мм`;
    if (!acc[diameterGroup]) {
      acc[diameterGroup] = [];
    }
    acc[diameterGroup].push(bearing);
    return acc;
  }, {} as Record<string, Bearing[]>);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка подшипников...</span>
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
          Замена подшипника
        </h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-1">Текущий элемент:</p>
          <p className="text-sm font-semibold text-yellow-900">{currentItem.positionName}</p>
          <div className="flex items-center space-x-4 text-xs text-yellow-700 mt-1">
            <span>Количество: {currentItem.totalQuantity}</span>
            <span>Сумма: {currentItem.totalRevenue.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по обозначению, размерам, производителю..."
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
            Выберите новый подшипник:
          </label>
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            {Object.keys(bearingsByDiameter).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery ? 'Ничего не найдено' : 'Нет доступных подшипников'}
              </div>
            ) : (
              Object.entries(bearingsByDiameter).map(([diameterGroup, diameterBearings]) => (
                <div key={diameterGroup} className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">
                    {diameterGroup}
                  </h4>
                  <div className="space-y-1 pl-3">
                    {diameterBearings.map((bearing) => (
                      <div
                        key={bearing.id}
                        onClick={() => setSelectedBearing(bearing)}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors border-2
                          ${selectedBearing?.id === bearing.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Circle className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {bearing.designation}
                              </p>
                              <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Ruler className="w-3 h-3" />
                                  <span>{bearing.inner_diameter}×{bearing.outer_diameter}×{bearing.width}</span>
                                </div>
                                <span>{bearing.bearing_type}</span>
                                <span>{bearing.seal_type}</span>
                              </div>
                              {bearing.manufacturer && (
                                <p className="text-xs text-gray-500 mt-1">{bearing.manufacturer}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Ruble className="w-4 h-4 text-green-600" />
                              <span className="font-bold text-green-600">
                                {bearing.price_per_unit.toLocaleString('ru-RU')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">за шт</p>
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

        <div className="flex items-center justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSelectBearing}
            disabled={!selectedBearing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Replace className="w-4 h-4" />
            <span>Заменить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
