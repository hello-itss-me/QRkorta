import React, { useState, useMemo, useRef } from 'react';
import { Motor, GroupedRepairItem } from '../types';
import { useMotors } from '../hooks/useMotors';
import { Loader2, AlertCircle, RussianRuble as Ruble, Search, X, Replace, Zap, ChevronsRight, Upload } from 'lucide-react';

interface MotorReplacerProps {
  onSelect: (motor: Motor) => void;
  onCancel: () => void;
  currentItem: GroupedRepairItem;
}

export const MotorReplacer: React.FC<MotorReplacerProps> = ({
  onSelect,
  onCancel,
  currentItem,
}) => {
  const { motors, loading, error, importMotors, fetchMotors } = useMotors();
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [generalSearchQuery, setGeneralSearchQuery] = useState(''); // Общий поиск
  const [powerQuery, setPowerQuery] = useState(''); // Поиск по мощности
  const [rpmQuery, setRpmQuery] = useState(''); // Поиск по оборотам
  const [manufacturerQuery, setManufacturerQuery] = useState(''); // Поиск по марке
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMotors = useMemo(() => {
    let currentFiltered = motors;

    const generalQuery = generalSearchQuery.toLowerCase().trim();
    if (generalQuery) {
      currentFiltered = currentFiltered.filter(motor =>
        motor.name.toLowerCase().includes(generalQuery) ||
        motor.power_kw.toString().includes(generalQuery) ||
        motor.rpm.toString().includes(generalQuery) ||
        (motor.manufacturer && motor.manufacturer.toLowerCase().includes(generalQuery))
      );
    }

    const powerQ = powerQuery.toLowerCase().trim();
    if (powerQ) {
      currentFiltered = currentFiltered.filter(motor =>
        motor.power_kw.toString().includes(powerQ)
      );
    }

    const rpmQ = rpmQuery.toLowerCase().trim();
    if (rpmQ) {
      currentFiltered = currentFiltered.filter(motor =>
        motor.rpm.toString().includes(rpmQ)
      );
    }

    const manufacturerQ = manufacturerQuery.toLowerCase().trim();
    if (manufacturerQ) {
      currentFiltered = currentFiltered.filter(motor =>
        motor.manufacturer && motor.manufacturer.toLowerCase().includes(manufacturerQ)
      );
    }

    return currentFiltered;
  }, [motors, generalSearchQuery, powerQuery, rpmQuery, manufacturerQuery]);

  const handleClearGeneralSearch = () => {
    setGeneralSearchQuery('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const result = await importMotors(file);
      setImportSuccess(`Успешно импортировано: ${result.newCount} новых, ${result.updatedCount} обновленных двигателей.`);
      await fetchMotors(); // Перезагружаем список двигателей после импорта
    } catch (err) {
      console.error('Error during motor import:', err);
      setImportError(err instanceof Error ? err.message : 'Неизвестная ошибка при импорте двигателей.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Сброс input file
      }
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSelectMotor = () => {
    if (selectedMotor) {
      onSelect(selectedMotor);
    }
  };

  const motorsByPower = filteredMotors.reduce((acc, motor) => {
    const powerGroup = `${motor.power_kw} кВт`;
    if (!acc[powerGroup]) {
      acc[powerGroup] = [];
    }
    acc[powerGroup].push(motor);
    return acc;
  }, {} as Record<string, Motor[]>);

  if (loading && !isImporting) {
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

  if (error && !isImporting) {
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
          Замена двигателя
        </h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-1">Текущий элемент:</p>
          <p className="text-sm font-semibold text-yellow-900">{currentItem.positionName}</p>
          <div className="flex items-center space-x-4 text-xs text-yellow-700 mt-1">
            <span>Количество: {currentItem.totalQuantity}</span>
            <span>Сумма: {currentItem.totalRevenue.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="mb-4 relative"> {/* Added relative here */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={generalSearchQuery}
              onChange={(e) => setGeneralSearchQuery(e.target.value)}
              placeholder="Поиск по названию, мощности, оборотам..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors z-10" // Added z-10
            />
            {generalSearchQuery && (
              <button
                onClick={handleClearGeneralSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20" // Added z-20 for button
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={powerQuery}
              onChange={(e) => setPowerQuery(e.target.value)}
              placeholder="Ввод кВт"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors z-10" // Added z-10
            />
            <input
              type="text"
              value={rpmQuery}
              onChange={(e) => setRpmQuery(e.target.value)}
              placeholder="Ввод оборотов"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors z-10" // Added z-10
            />
            <input
              type="text"
              value={manufacturerQuery}
              onChange={(e) => setManufacturerQuery(e.target.value)}
              placeholder="Ввод марки"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors z-10" // Added z-10
            />
          </div>
        </div>

        {importError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Ошибка импорта:</strong>
            <span className="block sm:inline"> {importError}</span>
          </div>
        )}
        {importSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Успех:</strong>
            <span className="block sm:inline"> {importSuccess}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите новый двигатель:
          </label>
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            {Object.keys(motorsByPower).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {generalSearchQuery || powerQuery || rpmQuery || manufacturerQuery ? 'Ничего не найдено' : 'Нет доступных двигателей'}
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
                            <Zap className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {motor.name}
                              </p>
                              <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                                <div className="flex items-center space-x-1">
                                  <ChevronsRight className="w-3 h-3" />
                                  <span>{motor.rpm} об/мин</span>
                                </div>
                                <span>{motor.voltage} В</span>
                                <span>{motor.efficiency}% КПД</span>
                              </div>
                              {motor.manufacturer && (
                                <p className="text-xs text-gray-500 mt-1">{motor.manufacturer}</p>
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

        <div className="flex items-center justify-between space-x-3 flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
            disabled={isImporting}
          />
          <button
            onClick={handleUploadButtonClick}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{isImporting ? 'Импорт...' : 'Загрузка из Excel'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSelectMotor}
              disabled={!selectedMotor}
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
