import React, { useState, useMemo, useEffect } from 'react';
import { IndividualEmployee, GroupedRepairItem } from '../types';
import { useIndividualEmployees } from '../hooks/useIndividualEmployees';
import { Loader2, AlertCircle, RussianRuble as Ruble, Search, X, Replace, User, Clock } from 'lucide-react';

interface EmployeeReplacerProps {
  onSelect: (employee: IndividualEmployee, hours: number) => void;
  onCancel: () => void;
  currentItem: GroupedRepairItem;
}

export const EmployeeReplacer: React.FC<EmployeeReplacerProps> = ({
  onSelect,
  onCancel,
  currentItem,
}) => {
  const { individualEmployees, loading, error } = useIndividualEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState<IndividualEmployee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hours, setHours] = useState(currentItem.quantity);

  const [viewMode, setViewMode] = useState<'jobTitles' | 'individualEmployees'>('jobTitles');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);

  useEffect(() => {
    setHours(currentItem.quantity);
  }, [currentItem]);

  const uniqueJobTitles = useMemo(() => {
    const titles = new Set<string>();
    individualEmployees.forEach(emp => titles.add(emp.job_title));
    return Array.from(titles).sort();
  }, [individualEmployees]);

  useEffect(() => {
    if (currentItem && currentItem.positionName && individualEmployees.length > 0) {
      // Attempt to extract job title from positionName, e.g., "Оплата труда Слесаря_ID..." -> "Слесарь"
      const match = currentItem.positionName.match(/Оплата труда (\w+)/i);
      if (match && match[1]) {
        // Capitalize first letter and make rest lowercase to match stored job_title format
        const extractedTitle = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        if (uniqueJobTitles.includes(extractedTitle)) {
          setSelectedJobTitle(extractedTitle);
          setViewMode('individualEmployees');
        }
      }
    }
  }, [currentItem, uniqueJobTitles, individualEmployees]);

  const employeesForCurrentView = useMemo(() => {
    if (viewMode === 'individualEmployees' && selectedJobTitle) {
      return individualEmployees.filter(emp => emp.job_title === selectedJobTitle);
    }
    return individualEmployees; // Fallback, though not strictly used in this view mode
  }, [individualEmployees, viewMode, selectedJobTitle]);

  const filteredList = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return viewMode === 'jobTitles' ? uniqueJobTitles : employeesForCurrentView;
    }

    if (viewMode === 'jobTitles') {
      return uniqueJobTitles.filter(title => title.toLowerCase().includes(query));
    } else { // individualEmployees view
      return employeesForCurrentView.filter(employee =>
        employee.full_name.toLowerCase().includes(query) ||
        employee.job_title.toLowerCase().includes(query) ||
        (employee.description && employee.description.toLowerCase().includes(query)) ||
        employee.hourly_rate.toString().includes(query)
      );
    }
  }, [searchQuery, viewMode, uniqueJobTitles, employeesForCurrentView]);

  const handleSelectEmployee = () => {
    if (selectedEmployee && hours > 0) {
      onSelect(selectedEmployee, hours);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка сотрудников...</span>
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
          Замена оплаты труда
        </h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-1">Текущий элемент:</p>
          <p className="text-sm font-semibold text-yellow-900">{currentItem.positionName}</p>
          <div className="flex items-center space-x-4 text-xs text-yellow-700 mt-1">
            <span>Часы: {currentItem.quantity} ч</span>
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
              placeholder={viewMode === 'jobTitles' ? "Поиск по должности..." : "Поиск по имени или должности..."}
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

        {viewMode === 'jobTitles' ? (
          /* Список должностей */
          <div className="flex-1 overflow-y-auto mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите должность:
            </label>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3">
              {filteredList.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchQuery ? 'Ничего не найдено' : 'Нет доступных должностей'}
                </div>
              ) : (
                (filteredList as string[]).map((title) => (
                  <div
                    key={title}
                    onClick={() => {
                      setSelectedJobTitle(title);
                      setViewMode('individualEmployees');
                      setSearchQuery(''); // Clear search when switching views
                      setSelectedEmployee(null); // Clear selected employee
                    }}
                    className="p-3 rounded-lg cursor-pointer transition-colors border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{title}</p>
                      <span className="text-sm text-gray-600">
                        ({individualEmployees.filter(e => e.job_title === title).length} сотрудников)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : ( // viewMode === 'individualEmployees'
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">Выбрана должность:</p>
              <p className="text-base font-semibold text-blue-900">{selectedJobTitle}</p>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите нового сотрудника:
              </label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                {filteredList.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery ? 'Ничего не найдено' : 'Нет сотрудников для этой должности'}
                  </div>
                ) : (
                  (filteredList as IndividualEmployee[]).map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-colors border-2
                        ${selectedEmployee?.id === employee.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            {employee.full_name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 pl-6">
                            {employee.job_title}
                            {employee.description && ` (${employee.description})`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Ruble className="w-4 h-4 text-red-600" />
                            <span className="font-bold text-red-600">
                              {employee.hourly_rate.toLocaleString('ru-RU')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">в час</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
                <label htmlFor="employee-hours" className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  Часы:
                </label>
                <input
                    id="employee-hours"
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="0"
                />
            </div>
            <div className="flex items-center space-x-3">
                <button
                    onClick={() => {
                      if (viewMode === 'individualEmployees') {
                        setViewMode('jobTitles');
                        setSelectedEmployee(null); // Clear selected employee
                        setSearchQuery(''); // Clear search
                      } else { // jobTitles view
                        onCancel();
                      }
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    {viewMode === 'jobTitles' ? 'Отмена' : 'Назад'}
                </button>
                <button
                    onClick={handleSelectEmployee}
                    disabled={!selectedEmployee || hours <= 0}
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
