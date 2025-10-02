import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PeriodSelectorModalProps {
  onSelectPeriod: (startDate: Date | null, endDate: Date | null) => void;
  onClose: () => void;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
}

// Helper to format date for display
const formatDate = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper functions for date calculations
const getStartOfMonth = (year: number, month: number) => new Date(year, month, 1);
const getEndOfMonth = (year: number, month: number) => new Date(year, month + 1, 0, 23, 59, 59, 999);

const getStartOfQuarter = (year: number, quarter: number) => {
  const month = (quarter - 1) * 3;
  return new Date(year, month, 1);
};
const getEndOfQuarter = (year: number, quarter: number) => {
  const month = quarter * 3;
  return new Date(year, month, 0, 23, 59, 59, 999); // Last day of the last month in the quarter
};

const getStartOfHalfYear = (year: number, half: number) => {
  const month = (half - 1) * 6;
  return new Date(year, month, 1);
};
const getEndOfHalfYear = (year: number, half: number) => {
  const month = half * 6;
  return new Date(year, month, 0, 23, 59, 59, 999);
};

const getStartOfYear = (year: number) => new Date(year, 0, 1);
const getEndOfYear = (year: number) => new Date(year, 11, 31, 23, 59, 59, 999);

export const PeriodSelectorModal: React.FC<PeriodSelectorModalProps> = ({
  onSelectPeriod,
  onClose,
  initialStartDate,
  initialEndDate,
}) => {
  const [currentYear, setCurrentYear] = useState(initialStartDate?.getFullYear() || new Date().getFullYear());

  const handlePeriodSelection = (type: 'day' | 'month' | 'quarter' | 'half-year' | 'year', value?: number) => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const today = new Date();

    switch (type) {
      case 'day':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        break;
      case 'month':
        if (value !== undefined) { // value is month index (0-11)
          startDate = getStartOfMonth(currentYear, value);
          endDate = getEndOfMonth(currentYear, value);
        }
        break;
      case 'quarter':
        if (value !== undefined) { // value is quarter number (1-4)
          startDate = getStartOfQuarter(currentYear, value);
          endDate = getEndOfQuarter(currentYear, value);
        }
        break;
      case 'half-year':
        if (value !== undefined) { // value is half-year number (1-2)
          startDate = getStartOfHalfYear(currentYear, value);
          endDate = getEndOfHalfYear(currentYear, value);
        }
        break;
      case 'year':
        startDate = getStartOfYear(currentYear);
        endDate = getEndOfYear(currentYear);
        break;
    }
    onSelectPeriod(startDate, endDate);
    onClose();
  };

  const months = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[450px] max-w-[90vw] mx-3 flex flex-col max-h-[90vh]">
        <div className="p-2 border-b flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">
            Выбор периода
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 flex-grow overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setCurrentYear(prev => prev - 1)} className="p-1 rounded-md hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-bold text-sm text-gray-800">{currentYear} год</span>
            <button onClick={() => setCurrentYear(prev => prev + 1)} className="p-1 rounded-md hover:bg-gray-100">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {months.map((month, index) => (
              <button
                key={month}
                onClick={() => handlePeriodSelection('month', index)}
                className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {month}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePeriodSelection('quarter', 1)}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              1 квартал
            </button>
            <button
              onClick={() => handlePeriodSelection('quarter', 2)}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              2 квартал
            </button>
            <button
              onClick={() => handlePeriodSelection('half-year', 1)}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              полугодие
            </button>
            <button
              onClick={() => handlePeriodSelection('quarter', 3)}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              3 квартал
            </button>
            <button
              onClick={() => handlePeriodSelection('quarter', 4)}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              4 квартал
            </button>
            <button
              onClick={() => handlePeriodSelection('year')}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              год
            </button>
            <button
              onClick={() => handlePeriodSelection('day')}
              className="p-1.5 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors col-span-3"
            >
              День
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
