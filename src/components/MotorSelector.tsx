import React, { useState, useMemo } from 'react';
import { Motor } from '../types';
import { useMotors } from '../hooks/useMotors';
import { Cog, Plus, Loader2, AlertCircle, RussianRuble as Ruble, Zap, Gauge, Search, X } from 'lucide-react';

interface MotorSelectorProps {
  onSelect: (motor: Motor, quantity: number) => void;
  onCancel: () => void;
  templateWorkType?: string;
  templateSalaryGoods?: string;
}

export const MotorSelector: React.FC<MotorSelectorProps> = ({
  onSelect,
  onCancel,
  templateWorkType = '',
  templateSalaryGoods = ''
}) => {
  const { motors, loading, error, addMotor } = useMotors();
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMotor, setNewMotor] = useState({
    name: '',
    power_kw: 1.0,
    rpm: 1500,
    voltage: 380,
    current: 0,
    efficiency: 80.0,
    price_per_unit: 0,
    description: '',
    manufacturer: 'Электром'
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // НОВОЕ состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');

  // НОВАЯ функция фильтрации двигателей
  const filteredMotors = useMemo(() => {
    if (!searchQuery.trim()) {
      return motors;
    }

    const query = searchQuery.toLowerCase().trim();
    return motors.filter(motor =>
      motor.name.toLowerCase().includes(query) ||
      motor.power_kw.toString().includes(query) ||
      motor.rpm.toString().includes(query) ||
      motor.voltage.toString().includes(query) ||
      motor.current.toString().includes(query) ||
      motor.efficiency.toString().includes(query) ||
      motor.price_per_unit.toString().includes(query) ||
      motor.manufacturer.toLowerCase().includes(query) ||
      motor.description.toLowerCase().includes(query)
    );
  }, [motors, searchQuery]);

  const handleSelectMotor = () => {
    if (selectedMotor && quantity > 0) {
      onSelect(selectedMotor, quantity);
    }
  };

  const handleAddNewMotor = async () => {
    if (!newMotor.name.trim() || newMotor.price_per_unit <= 0) return;

    try {
      setIsAdding(true);
      const motorToAdd = await addMotor({
        ...newMotor,
        name: newMotor.name.trim(),
        description: newMotor.description.trim(),
        manufacturer: newMotor.manufacturer.trim(),
        is_active: true
      });

      setSelectedMotor(motorToAdd);
      setShowAddForm(false);
      setNewMotor({
        name: '',
        power_kw: 1.0,
        rpm: 1500,
        voltage: 380,
        current: 0,
        efficiency: 80.0,
        price_per_unit: 0,
        description: '',
        manufacturer: 'Электром'
      });
    } catch (err) {
      console.error('Error adding motor:', err);
      alert('Ошибка добавления двигателя');
    } finally {
      setIsAdding(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedMotor || quantity <= 0) return 0;
    return selectedMotor.price_per_unit * quantity;
  };

  // НОВАЯ функция для очистки поиска
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Группируем двигатели по мощности (только отфильтрованные)
  const motorsByPower = filteredMotors.reduce((acc, motor) => {
    const powerGroup = `${motor.power_kw} кВт`;
    if (!acc[powerGroup]) {
      acc[powerGroup] = [];
    }
    acc[powerGroup].push(motor);
    return acc;
  }, {} as Record<string, Motor[]>);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка двигателей...</span>
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
          Выбор двигателя из справочника
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
                  placeholder="Поиск по названию, мощности, оборотам, производителю..."
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
                  Найдено: {filteredMotors.length} из {motors.length}
                </p>
              )}
            </div>

            {/* Список двигателей по мощности */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите двигатель:
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {Object.keys(motorsByPower).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery ? 'Ничего не найдено' : 'Нет доступных двигателей'}
                  </div>
                ) : (
                  Object.entries(motorsByPower).map(([powerGroup, powerMotors]) => (
                    <div key={powerGroup} className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">
                        {powerGroup}
                      </h4>
                      <div className="space-y-1 pl-3">
                        {powerMotors.map((motor) => (
                          <div
                            key={motor.id}
                            onClick={() => setSelectedMotor(motor)}
                            className={`
                              p-3 rounded-lg cursor-pointer transition-colors border-2
                              ${selectedMotor?.id === motor.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Cog className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {motor.name}
                                  </p>
                                  <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                                    <div className="flex items-center space-x-1">
                                      <Gauge className="w-3 h-3" />
                                      <span>{motor.rpm} об/мин</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Zap className="w-3 h-3" />
                                      <span>{motor.voltage} В</span>
                                    </div>
                                    {motor.current > 0 && (
                                      <span>{motor.current} А</span>
                                    )}
                                    {motor.efficiency > 0 && (
                                      <span>КПД {motor.efficiency}%</span>
                                    )}
                                  </div>
                                  {motor.manufacturer && (
                                    <p className="text-xs text-gray-500 mt-1">{motor.manufacturer}</p>
                                  )}
                                  {motor.description && (
                                    <p className="text-xs text-gray-500 mt-1">{motor.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-1">
                                  <Ruble className="w-4 h-4 text-green-600" />
                                  <span className="font-bold text-green-600">
                                    {motor.price_per_unit.toLocaleString('ru-RU')}
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

            {/* Кнопка добавления нового двигателя */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить новый двигатель</span>
              </button>
            </div>

            {/* Поле для ввода количества */}
            {selectedMotor && (
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
                      {selectedMotor.price_per_unit.toLocaleString('ru-RU')} ₽/шт × {quantity} шт =
                    </span>
                    <span className="font-bold text-gray-900">
                      {calculateTotal().toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedMotor.name} • {selectedMotor.power_kw} кВт • {selectedMotor.rpm} об/мин
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Форма добавления нового двигателя */
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Добавить новый двигатель</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название двигателя:
                </label>
                <input
                  type="text"
                  value={newMotor.name}
                  onChange={(e) => setNewMotor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Например: АИР132S4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Мощность (кВт):
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newMotor.power_kw}
                    onChange={(e) => setNewMotor(prev => ({ ...prev, power_kw: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Обороты (об/мин):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newMotor.rpm}
                    onChange={(e) => setNewMotor(prev => ({ ...prev, rpm: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Напряжение (В):
                  </label>
                  <select
                    value={newMotor.voltage}
                    onChange={(e) => setNewMotor(prev => ({ ...prev, voltage: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={220}>220</option>
                    <option value={380}>380</option>
                    <option value={660}>660</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ток (А):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newMotor.current}
                    onChange={(e) => setNewMotor(prev => ({ ...prev, current: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    КПД (%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newMotor.efficiency}
                    onChange={(e) => setNewMotor(prev => ({ ...prev, efficiency: parseFloat(e.target.value) || 0 }))}
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
                    value={newMotor.price_per_unit}
                    onChange={(e) => setNewMotor(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Производитель:
                </label>
                <input
                  type="text"
                  value={newMotor.manufacturer}
                  onChange={(e) => setNewMotor(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Например: Электром, Сибэлектромотор"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (необязательно):
                </label>
                <textarea
                  value={newMotor.description}
                  onChange={(e) => setNewMotor(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание двигателя"
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
              onClick={handleAddNewMotor}
              disabled={!newMotor.name.trim() || newMotor.price_per_unit <= 0 || isAdding}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAdding ? 'Добавление...' : 'Добавить'}</span>
            </button>
          ) : (
            <button
              onClick={handleSelectMotor}
              disabled={!selectedMotor || quantity <= 0}
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
