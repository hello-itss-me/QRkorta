import React, { useState, useRef, useEffect } from 'react';
import { GroupedRepairItem, RepairItem } from '../types';
import { GripVertical, RussianRuble as Ruble, Edit3, Check, X, Replace } from 'lucide-react';

interface GroupedRepairItemCardProps {
  item: GroupedRepairItem;
  onDragStart: (item: GroupedRepairItem) => void;
  fromPositionId: string;
  isBeingDragged: boolean;
  onQuantityChange: (item: GroupedRepairItem, newQuantity: number) => void;
  maxAvailableQuantity: number;
  onPriceChange?: (itemId: string, newRevenue: number) => void;
  onEmployeeHoursChange?: (itemId: string, newHours: number) => void;
  onReplaceItem?: (item: GroupedRepairItem) => void;
}

const GroupedRepairItemCard: React.FC<GroupedRepairItemCardProps> = ({
  item,
  onDragStart,
  fromPositionId,
  isBeingDragged,
  onQuantityChange,
  maxAvailableQuantity,
  onPriceChange,
  onEmployeeHoursChange,
  onReplaceItem
}) => {
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const [priceEditValue, setPriceEditValue] = useState(Math.abs(item.revenue));
  const [isHoursEditing, setIsHoursEditing] = useState(false);
  const [hoursEditValue, setHoursEditValue] = useState(item.quantity);
  
  const priceInputRef = useRef<HTMLInputElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPriceEditing && priceInputRef.current) {
      priceInputRef.current.focus();
      priceInputRef.current.select();
    }
  }, [isPriceEditing]);

  useEffect(() => {
    if (isHoursEditing && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [isHoursEditing]);

  useEffect(() => {
    setPriceEditValue(Math.abs(item.revenue));
  }, [item.revenue]);

  useEffect(() => {
    setHoursEditValue(item.quantity);
  }, [item.quantity]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item);
  };

  const handlePriceSave = () => {
    if (onPriceChange && priceEditValue >= 0) {
      const newRevenue = item.incomeExpenseType === 'Расходы' ? -priceEditValue : priceEditValue;
      onPriceChange(item.groupedIds[0], newRevenue);
    }
    setIsPriceEditing(false);
  };

  const handleHoursSave = () => {
    if (onEmployeeHoursChange && hoursEditValue > 0) {
      onEmployeeHoursChange(item.groupedIds[0], hoursEditValue);
    }
    setIsHoursEditing(false);
  };

  const isEmployeeCard = item.positionName.toLowerCase().includes('оплата труда') && 
                         item.incomeExpenseType === 'Расходы' &&
                         item.salaryGoods.toLowerCase().includes('зарплата');

  const isBearingItem = item.positionName.toLowerCase().includes('подшипника');
  const isMotorItem = item.positionName.toLowerCase().includes('двигателя');
  const isWireItem = item.positionName.toLowerCase().includes('провод');

  const priceColor = item.incomeExpenseType === 'Доходы' ? 'text-green-600' : 'text-red-600';

  return (
    <div
      className={`
        bg-white rounded-lg border-2 p-3 transition-all duration-200 group
        ${isBeingDragged 
          ? 'border-blue-400 bg-blue-50 shadow-lg' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          <div 
            className="cursor-grab text-gray-400 hover:text-gray-600 pt-1"
            draggable
            onDragStart={handleDragStart}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{item.positionName}</p>
            
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1">
                <Ruble className={`w-4 h-4 ${priceColor}`} />
                {isPriceEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      ref={priceInputRef}
                      type="number"
                      value={priceEditValue}
                      onChange={(e) => setPriceEditValue(parseFloat(e.target.value) || 0)}
                      className="w-24 px-1 py-0.5 border border-gray-300 rounded text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePriceSave();
                        if (e.key === 'Escape') setIsPriceEditing(false);
                      }}
                      onBlur={handlePriceSave}
                    />
                    <button onClick={handlePriceSave} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setIsPriceEditing(false)} className="p-0.5 text-red-600 hover:bg-red-50 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-bold ${priceColor} cursor-pointer hover:underline`}
                    onClick={() => setIsPriceEditing(true)}
                  >
                    {Math.abs(item.revenue).toLocaleString('ru-RU')}
                  </span>
                )}
                {(isBearingItem || isMotorItem || isWireItem || isEmployeeCard) && onReplaceItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onReplaceItem) {
                        onReplaceItem(item);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                    title={
                      isBearingItem ? "Заменить подшипник" : 
                      isMotorItem ? "Заменить двигатель" : 
                      isWireItem ? "Заменить провод" :
                      "Заменить сотрудника"
                    }
                  >
                    <Replace className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {isEmployeeCard && (
                <div className="text-sm text-gray-600">
                  {isHoursEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        ref={hoursInputRef}
                        type="number"
                        value={hoursEditValue}
                        onChange={(e) => setHoursEditValue(parseFloat(e.target.value) || 0)}
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleHoursSave();
                          if (e.key === 'Escape') setIsHoursEditing(false);
                        }}
                        onBlur={handleHoursSave}
                      />
                      <span>ч</span>
                    </div>
                  ) : (
                    <span className="cursor-pointer hover:underline" onClick={() => setIsHoursEditing(true)}>
                      ({item.quantity} ч)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onQuantityChange(item, item.totalQuantity - 1)}
            disabled={item.totalQuantity <= 1}
            className="px-2 py-1 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{item.totalQuantity}</span>
          <button
            onClick={() => onQuantityChange(item, item.totalQuantity + 1)}
            disabled={maxAvailableQuantity === 0}
            className="px-2 py-1 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupedRepairItemCard;
