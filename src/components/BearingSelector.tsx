import React, { useState, useMemo } from 'react';
import { Bearing } from '../types';
import { useBearings } from '../hooks/useBearings';
import { Circle, Plus, Loader2, AlertCircle, RussianRuble as Ruble, Ruler, Search, X } from 'lucide-react';

interface BearingSelectorProps {
  onSelect: (bearing: Bearing, quantity: number) => void;
  onCancel: () => void;
  templateWorkType?: string;
  templateSalaryGoods?: string;
}

export const BearingSelector: React.FC<BearingSelectorProps> = ({
  onSelect,
  onCancel,
  templateWorkType = '',
  templateSalaryGoods = ''
}) => {
  const { bearings, loading, error, addBearing } = useBearings();
  const [selectedBearing, setSelectedBearing] = useState<Bearing | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBearing, setNewBearing] = useState({
    designation: '',
    inner_diameter: 25,
    outer_diameter: 52,
    width: 15,
    bearing_type: 'Шариковый',
    seal_type: '2RS',
    manufacturer: 'SKF',
    price_per_unit: 0,
    description: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // НОВОЕ состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');

  // НОВАЯ функция фильтрации подшипников
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
      bearing.bearing_type.toLowerCase().includes(query) ||
      bearing.seal_type.toLowerCase().includes(query) ||
      bearing.manufacturer.toLowerCase().includes(query) ||
      bearing.price_per_unit.toString().includes(query) ||
      bearing.description.toLowerCase().includes(query)
    );
  }, [bearings, searchQuery]);

  const handleSelectBearing = () => {
    if (selectedBearing && quantity > 0) {
      onSelect(selectedBearing, quantity);
    }
  };

  const handleAddNewBearing = async () => {
    if (!newBearing.designation.trim() || newBearing.price_per_unit <= 0) return;

    try {
      setIsAdding(true);
      const bearingToAdd = await addBearing({
        ...newBearing,
        designation: newBearing.designation.trim(),
        description: newBearing.description.trim(),
        manufacturer: newBearing.manufacturer.trim(),
        is_active: true
      });

      setSelectedBearing(bearingToAdd);
      setShowAddForm(false);
      setNewBearing({
        designation: '',
        inner_diameter: 25,
        outer_diameter: 52,
        width: 15,
        bearing_type: 'Шариковый',
        seal_type: '2RS',
        manufacturer: 'SKF',
        price_per_unit: 0,
        description: ''
      });
    } catch (err) {
      console.error('Error adding bearing:', err);
      alert('Ошибка добавления подшипника');
    } finally {
      setIsAdding(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedBearing || quantity <= 0) return 0;
    return selectedBearing.price_per_unit * quantity;
  };

  // НОВАЯ функция для очистки поиска
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Группируем подшипники по внутреннему диаметру (только отфильтрованные)
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
      <div className="bg-white rounded-lg p-6 w-[700px] max-w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Выбор подшипника из справочника
        </h3>

        {/* Информация о шаблоне */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-1">Создание карточки:</p>
          <p className="text-sm text-blue-700">Статья работ: {templateWorkType}</p>
          <p className="text-sm text-blue-700">Категория: {templateSalaryGoods}</p>
        </div>

        {!showAddForm ? (
          <>
            {/* НОВАЯ строка поиска */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по обозначению, размерам, типу, производителю..."
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
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-1">
                  Найдено: {filteredBearings.length} из {bearings.length}
                </p>
              )}
            </div>

            {/* Список подшипников по диаметрам */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите подшипник:
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
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
                                  {bearing.description && (
                                    <p className="text-xs text-gray-500 mt-1">{bearing.description}</p>
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

            {/* Кнопка добавления нового подшипника */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить новый подшипник</span>
              </button>
            </div>

            {/* Поле для ввода количества */}
            {selectedBearing && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество (штук):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите количество"
                />
                
                {/* Расчет общей суммы */}
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {selectedBearing.price_per_unit.toLocaleString('ru-RU')} ₽/шт × {quantity} шт =
                    </span>
                    <span className="font-bold text-gray-900">
                      {calculateTotal().toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedBearing.designation} • {selectedBearing.inner_diameter}×{selectedBearing.outer_diameter}×{selectedBearing.width} • {selectedBearing.seal_type}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Форма добавления нового подшипника */
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Добавить новый подшипник</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Обозначение подшипника:
                </label>
                <input
                  type="text"
                  value={newBearing.designation}
                  onChange={(e) => setNewBearing(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="Например: 6309-2RS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Внутр. Ø (мм):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={newBearing.inner_diameter}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, inner_diameter: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Наруж. Ø (мм):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={newBearing.outer_diameter}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, outer_diameter: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ширина (мм):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={newBearing.width}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип подшипника:
                  </label>
                  <select
                    value={newBearing.bearing_type}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, bearing_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Шариковый">Шариковый</option>
                    <option value="Роликовый">Роликовый</option>
                    <option value="Игольчатый">Игольчатый</option>
                    <option value="Упорный">Упорный</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип уплотнения:
                  </label>
                  <select
                    value={newBearing.seal_type}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, seal_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Открытый">Открытый</option>
                    <option value="2RS">2RS</option>
                    <option value="ZZ">ZZ</option>
                    <option value="2RZ">2RZ</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Производитель:
                  </label>
                  <input
                    type="text"
                    value={newBearing.manufacturer}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Например: SKF, FAG, NSK"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена (₽):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newBearing.price_per_unit}
                    onChange={(e) => setNewBearing(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (необязательно):
                </label>
                <textarea
                  value={newBearing.description}
                  onChange={(e) => setNewBearing(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание подшипника"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={showAddForm ? () => setShowAddForm(false) : onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showAddForm ? 'Назад' : 'Отмена'}
          </button>
          
          {showAddForm ? (
            <button
              onClick={handleAddNewBearing}
              disabled={!newBearing.designation.trim() || newBearing.price_per_unit <= 0 || isAdding}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAdding ? 'Добавление...' : 'Добавить'}</span>
            </button>
          ) : (
            <button
              onClick={handleSelectBearing}
              disabled={!selectedBearing || quantity <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Создать карточку
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
