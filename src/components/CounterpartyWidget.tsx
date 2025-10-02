import React from 'react';
import { Counterparty } from '../types';
import { Users, Edit, Building } from 'lucide-react';

interface CounterpartyWidgetProps {
  counterparty: Counterparty | null;
  onOpenSelector: () => void;
}

const CounterpartyWidget: React.FC<CounterpartyWidgetProps> = ({ counterparty, onOpenSelector }) => {
  if (!counterparty) {
    return (
      <div className="flex items-center p-1 border border-gray-300 rounded-lg bg-white w-fit">
        <span className="text-sm font-medium text-gray-700 ml-2 mr-3">Контрагент:</span>
        <button
          onClick={onOpenSelector}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Выбрать контрагента"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 w-fit">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Building className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="flex items-baseline space-x-2 min-w-0">
            <span className="text-sm font-medium text-gray-800 flex-shrink-0">Контрагент:</span>
            <p className="text-sm text-gray-700 truncate" title={counterparty.name}>
              {counterparty.name}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSelector}
          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Сменить контрагента"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CounterpartyWidget;
