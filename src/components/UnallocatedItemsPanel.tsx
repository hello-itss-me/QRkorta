import React, { useState, useMemo, useEffect } from 'react';
import { RepairItem, GroupedRepairItem, Employee, Wire, Motor, Bearing } from '../types';
import { GroupedRepairItemCard } from './GroupedRepairItemCard';
import { EmployeeSelector } from './EmployeeSelector';
import { WireSelector } from './WireSelector';
import { MotorSelector } from './MotorSelector';
import { BearingSelector } from './BearingSelector';
import { groupByBasePositionName } from '../utils/groupingUtils';
import { useHotkeys } from '../hooks/useHotkeys';
import { HotkeySettingsModal } from './HotkeySettingsModal';
import { SearchBar } from './SearchBar';
import { Package2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Minimize2, Maximize2, TrendingUp, TrendingDown, RussianRuble as Ruble, Plus, Settings, Keyboard } from 'lucide-react';

interface UnallocatedItemsPanelProps {
  items: RepairItem[];
  onDragStart: (item: GroupedRepairItem) => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
  draggedItem: GroupedRepairItem | null;
  draggedFromPositionId: string | null;
  searchQuery?: string;
  onSearchChange: (query: string) => void;
  totalUnallocatedCount?: number;
  onIncreaseQuantity: (item: GroupedRepairItem) => void;
  onCreatePositionFromGroup?: (item: GroupedRepairItem) => void;
  onAddNewItem?: (templateItem: RepairItem, newName: string) => void;
  onAddEmployeeItem?: (templateItem: RepairItem, employee: Employee, hours: number) => void;
  onAddWireItem?: (templateItem: RepairItem, wire: Wire, length: number) => void;
  onAddMotorItem?: (templateItem: RepairItem, motor: Motor, quantity: number) => void;
  onAddBearingItem?: (templateItem: RepairItem, bearing: Bearing, quantity: number) => void;
}

interface SalaryGoodsGroup {
  salaryGoods: string;
  workTypeGroups: WorkTypeGroup[];
  isCollapsed: boolean;
}

interface WorkTypeGroup {
  workType: string;
  items: GroupedRepairItem[];
  isCollapsed: boolean;
}

export const UnallocatedItemsPanel: React.FC<UnallocatedItemsPanelProps> = ({
  items,
  onDragStart,
  onDrop,
  onDragOver,
  draggedItem,
  draggedFromPositionId,
  searchQuery = '',
  onSearchChange,
  totalUnallocatedCount = 0,
  onIncreaseQuantity,
  onCreatePositionFromGroup,
  onAddNewItem,
  onAddEmployeeItem,
  onAddWireItem,
  onAddMotorItem,
  onAddBearingItem
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState<'standard' | 'wide' | 'extra-wide'>('standard');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [collapsedSalaryGoods, setCollapsedSalaryGoods] = useState<Set<string>>(new Set());
  const [collapsedWorkTypes, setCollapsedWorkTypes] = useState<Set<string>>(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<RepairItem | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [employeeTemplateItem, setEmployeeTemplateItem] = useState<RepairItem | null>(null);

  const [showWireSelector, setShowWireSelector] = useState(false);
  const [wireTemplateItem, setWireTemplateItem] = useState<RepairItem | null>(null);

  const [showMotorSelector, setShowMotorSelector] = useState(false);
  const [motorTemplateItem, setMotorTemplateItem] = useState<RepairItem | null>(null);

  const [showBearingSelector, setShowBearingSelector] = useState(false);
  const [bearingTemplateItem, setBearingTemplateItem] = useState<RepairItem | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      const salaryGoodsSet = new Set<string>();
      const workTypeSet = new Set<string>();
      
      items.forEach(item => {
        const salaryGoods = item.salaryGoods.trim();
        const workType = item.workType.trim() || 'Без статьи работ';
        
        if (salaryGoods) {
          salaryGoodsSet.add(salaryGoods);
          workTypeSet.add(`${salaryGoods}_${workType}`);
        }
      });
      
      setCollapsedSalaryGoods(salaryGoodsSet);
      setCollapsedWorkTypes(workTypeSet);
    } else {
      setCollapsedSalaryGoods(new Set());
      setCollapsedWorkTypes(new Set());
    }
  }, [items.length]);

  const groupedItems = useMemo(() => {
    const baseGrouped = groupByBasePositionName(items);
    
    const salaryGoodsGroups: SalaryGoodsGroup[] = [];
    const itemsWithoutSalaryGoods: GroupedRepairItem[] = [];

    const salaryGoodsMap = new Map<string, GroupedRepairItem[]>();
    
    baseGrouped.forEach(item => {
      const salaryGoods = item.salaryGoods.trim();
      if (salaryGoods) {
        if (!salaryGoodsMap.has(salaryGoods)) {
          salaryGoodsMap.set(salaryGoods, []);
        }
        salaryGoodsMap.get(salaryGoods)!.push(item);
      } else {
        itemsWithoutSalaryGoods.push(item);
      }
    });

    salaryGoodsMap.forEach((salaryGoodsItems, salaryGoods) => {
      const workTypeMap = new Map<string, GroupedRepairItem[]>();
      
      salaryGoodsItems.forEach(item => {
        const workType = item.workType.trim();
        const key = workType || 'Без статьи работ';
        if (!workTypeMap.has(key)) {
          workTypeMap.set(key, []);
        }
        workTypeMap.get(key)!.push(item);
      });

      const workTypeGroups: WorkTypeGroup[] = [];
      
      workTypeMap.forEach((workTypeItems, workType) => {
        workTypeGroups.push({
          workType,
          items: workTypeItems,
          isCollapsed: collapsedWorkTypes.has(`${salaryGoods}_${workType}`)
        });
      });

      workTypeGroups.sort((a, b) => a.workType.localeCompare(b.workType, 'ru'));

      salaryGoodsGroups.push({
        salaryGoods,
        workTypeGroups,
        isCollapsed: collapsedSalaryGoods.has(salaryGoods)
      });
    });

    salaryGoodsGroups.sort((a, b) => a.salaryGoods.localeCompare(b.salaryGoods, 'ru'));

    return { salaryGoodsGroups, itemsWithoutSalaryGoods };
  }, [items, collapsedSalaryGoods, collapsedWorkTypes]);

  const toggleAllSalaryGoods = () => {
    const allSalaryGoodsKeys = groupedItems.salaryGoodsGroups.map(g => g.salaryGoods);
    const areAllCollapsed = collapsedSalaryGoods.size >= allSalaryGoodsKeys.length;
    if (areAllCollapsed) {
        setCollapsedSalaryGoods(new Set());
    } else {
        setCollapsedSalaryGoods(new Set(allSalaryGoodsKeys));
    }
  };

  const toggleAllWorkTypes = () => {
      const allWorkTypeKeys = groupedItems.salaryGoodsGroups.flatMap(sg => 
          sg.workTypeGroups.map(wt => `${sg.salaryGoods}_${wt.workType}`)
      );
      const areAllCollapsed = collapsedWorkTypes.size >= allWorkTypeKeys.length;
      if (areAllCollapsed) {
          setCollapsedWorkTypes(new Set());
      } else {
          setCollapsedWorkTypes(new Set(allWorkTypeKeys));
      }
  };

  const { hotkeys, updateHotkey } = useHotkeys({
      toggleLevel1: toggleAllSalaryGoods,
      toggleLevel2: toggleAllWorkTypes,
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const toggleSalaryGoodsCollapse = (salaryGoods: string) => {
    const newCollapsedSalaryGoods = new Set(collapsedSalaryGoods);
    if (newCollapsedSalaryGoods.has(salaryGoods)) {
      newCollapsedSalaryGoods.delete(salaryGoods);
    } else {
      newCollapsedSalaryGoods.add(salaryGoods);
    }
    setCollapsedSalaryGoods(newCollapsedSalaryGoods);
  };

  const toggleWorkTypeCollapse = (salaryGoods: string, workType: string) => {
    const key = `${salaryGoods}_${workType}`;
    const newCollapsedWorkTypes = new Set(collapsedWorkTypes);
    if (newCollapsedWorkTypes.has(key)) {
      newCollapsedWorkTypes.delete(key);
    } else {
      newCollapsedWorkTypes.add(key);
    }
    setCollapsedWorkTypes(newCollapsedWorkTypes);
  };

  const toggleAllGroups = () => {
    const allSalaryGoods = groupedItems.salaryGoodsGroups.map(group => group.salaryGoods);
    
    if (collapsedSalaryGoods.size === allSalaryGoods.length) {
      setCollapsedSalaryGoods(new Set());
    } else {
      setCollapsedSalaryGoods(new Set(allSalaryGoods));
    }
  };

  const handleAddNewItem = (templateItem: RepairItem) => {
    setSelectedTemplateItem(templateItem);
    setNewItemName('');
    setShowAddModal(true);
  };

  const handleCreateNewItem = () => {
    if (!selectedTemplateItem || !newItemName.trim()) return;
    
    if (onAddNewItem) {
      onAddNewItem(selectedTemplateItem, newItemName.trim());
    }
    
    setShowAddModal(false);
    setSelectedTemplateItem(null);
    setNewItemName('');
  };

  const handleCancelAddItem = () => {
    setShowAddModal(false);
    setSelectedTemplateItem(null);
    setNewItemName('');
  };

  const handleAddEmployeeItem = (templateItem: RepairItem) => {
    setEmployeeTemplateItem(templateItem);
    setShowEmployeeSelector(true);
  };

  const handleEmployeeSelected = (employee: Employee, hours: number) => {
    if (!employeeTemplateItem || !onAddEmployeeItem) return;
    
    onAddEmployeeItem(employeeTemplateItem, employee, hours);
    setShowEmployeeSelector(false);
    setEmployeeTemplateItem(null);
  };

  const handleCancelEmployeeSelection = () => {
    setShowEmployeeSelector(false);
    setEmployeeTemplateItem(null);
  };

  const handleAddWireItem = (templateItem: RepairItem) => {
    setWireTemplateItem(templateItem);
    setShowWireSelector(true);
  };

  const handleWireSelected = (wire: Wire, length: number) => {
    if (!wireTemplateItem || !onAddWireItem) return;
    
    onAddWireItem(wireTemplateItem, wire, length);
    setShowWireSelector(false);
    setWireTemplateItem(null);
  };

  const handleCancelWireSelection = () => {
    setShowWireSelector(false);
    setWireTemplateItem(null);
  };

  const handleAddMotorItem = (templateItem: RepairItem) => {
    setMotorTemplateItem(templateItem);
    setShowMotorSelector(true);
  };

  const handleMotorSelected = (motor: Motor, quantity: number) => {
    if (!motorTemplateItem || !onAddMotorItem) return;
    
    onAddMotorItem(motorTemplateItem, motor, quantity);
    setShowMotorSelector(false);
    setMotorTemplateItem(null);
  };

  const handleCancelMotorSelection = () => {
    setShowMotorSelector(false);
    setMotorTemplateItem(null);
  };

  const handleAddBearingItem = (templateItem: RepairItem) => {
    setBearingTemplateItem(templateItem);
    setShowBearingSelector(true);
  };

  const handleBearingSelected = (bearing: Bearing, quantity: number) => {
    if (!bearingTemplateItem || !onAddBearingItem) return;
    
    onAddBearingItem(bearingTemplateItem, bearing, quantity);
    setShowBearingSelector(false);
    setBearingTemplateItem(null);
  };

  const handleCancelBearingSelection = () => {
    setShowBearingSelector(false);
    setBearingTemplateItem(null);
  };

  const getIncomeExpenseFromGroup = (groupedItem: GroupedRepairItem, originalItems: RepairItem[]) => {
    const groupItems = originalItems.filter(item => groupedItem.groupedIds.includes(item.id));
    
    const incomeItems = groupItems.filter(item => item.incomeExpenseType === 'Доходы');
    const expenseItems = groupItems.filter(item => item.incomeExpenseType === 'Расходы');
    
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpense = expenseItems.reduce((sum, item) => sum + Math.abs(item.revenue), 0);
    
    return {
      incomeItems,
      expenseItems,
      totalIncome,
      totalExpense,
      hasIncome: incomeItems.length > 0,
      hasExpense: expenseItems.length > 0
    };
  };

  const handleGroupDragStart = (e: React.DragEvent, groupedItem: GroupedRepairItem) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(groupedItem);
  };

  const shouldShowWireButton = (salaryGoods: string): boolean => {
    const lowerSalaryGoods = salaryGoods.toLowerCase();
    return lowerSalaryGoods.includes('товар') || 
           lowerSalaryGoods.includes('провод') || 
           lowerSalaryGoods.includes('материал') ||
           lowerSalaryGoods.includes('комплектующ');
  };

  const shouldShowMotorButton = (salaryGoods: string, workType: string): boolean => {
    const lowerSalaryGoods = salaryGoods.toLowerCase();
    const lowerWorkType = workType.toLowerCase();
    
    const isDvigatelCategory = lowerSalaryGoods.includes('двигатель') || 
                               lowerSalaryGoods.includes('мотор') || 
                               lowerSalaryGoods.includes('электродвигатель');
    
    const isMotorRepairWork = lowerWorkType.includes('ремонт') && 
                              lowerWorkType.includes('двигател') &&
                              !lowerWorkType.includes('замен');
    
    const isStandardWork = lowerWorkType.includes('стандарт') &&
                           !lowerWorkType.includes('замен');
    
    return isDvigatelCategory && (isMotorRepairWork || isStandardWork);
  };

  const shouldShowBearingButton = (workType: string): boolean => {
    const lowerWorkType = workType.toLowerCase();
    return lowerWorkType.includes('замен') || 
           lowerWorkType.includes('расходник') || 
           lowerWorkType.includes('подшипник') ||
           lowerWorkType.includes('комплектующ');
  };

  const getWidthClass = () => {
    if (isCollapsed) return 'w-12';
    switch (panelWidth) {
      case 'standard':
        return 'w-96'; // 384px
      case 'wide':
        return 'w-[500px]';
      case 'extra-wide':
        return 'w-[640px]';
      default:
        return 'w-96';
    }
  };

  const togglePanelWidth = () => {
    setPanelWidth(current => {
      if (current === 'standard') return 'wide';
      if (current === 'wide') return 'extra-wide';
      return 'standard';
    });
  };

  const canReceiveDrop = draggedItem !== null && draggedFromPositionId !== null;
  const hasSearchFilter = searchQuery.trim() !== '';
  const displayCount = hasSearchFilter ? items.length : totalUnallocatedCount || items.length;

  const hasGroups = groupedItems.salaryGoodsGroups.length > 0 || groupedItems.itemsWithoutSalaryGoods.length > 0;
  const allGroupsCollapsed = collapsedSalaryGoods.size === groupedItems.salaryGoodsGroups.length;

  return (
    <>
      <div className={`
        bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0
        ${getWidthClass()}
      `}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          {!isCollapsed && (
            <>
              <div className="flex items-center space-x-2">
                <Package2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Неразмещенные позиции
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                {hasGroups && (
                  <button
                    onClick={toggleAllGroups}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title={allGroupsCollapsed ? 'Развернуть все группы' : 'Свернуть все группы'}
                  >
                    {allGroupsCollapsed ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={togglePanelWidth}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Изменить ширину панели"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Search Bar Area */}
        {!isCollapsed && totalUnallocatedCount > 0 && (
          <div className="p-4 border-b border-gray-200">
            <SearchBar 
              searchQuery={searchQuery} 
              onSearchChange={onSearchChange} 
              placeholder="Поиск..." 
            />
            {hasSearchFilter && (
              <div className="text-xs text-gray-500 mt-2">
                Найдено: <span className="font-medium text-blue-600">{items.length}</span> из {totalUnallocatedCount}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        {!isCollapsed && (
          <div
            className={`
              flex-1 p-4 overflow-y-auto min-h-0 transition-all duration-200
              ${isDragOver && canReceiveDrop ? 'bg-red-50' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isDragOver && canReceiveDrop && (
              <div className="border-2 border-red-400 border-dashed rounded-lg p-4 bg-red-50 text-center mb-3">
                <p className="text-red-600 font-medium">Отпустите для возврата в неразмещенные</p>
              </div>
            )}
            
            {items.length === 0 && !isDragOver ? (
              <div className="text-center py-8">
                <Package2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {hasSearchFilter ? 'Ничего не найдено' : 'Все позиции размещены'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Группы по Зарплата/Товары */}
                {groupedItems.salaryGoodsGroups.map((salaryGoodsGroup) => (
                  <div key={salaryGoodsGroup.salaryGoods} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Заголовок группы Зарплата/Товары */}
                    <button
                      onClick={() => toggleSalaryGoodsCollapse(salaryGoodsGroup.salaryGoods)}
                      className="w-full px-3 py-2 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-indigo-900 text-sm">
                          {salaryGoodsGroup.salaryGoods}
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          {salaryGoodsGroup.workTypeGroups.reduce((sum, wg) => sum + wg.items.length, 0)}
                        </span>
                      </div>
                      {salaryGoodsGroup.isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-indigo-500" />
                      )}
                    </button>
                    
                    {/* Группы по статье работ внутри Зарплата/Товары */}
                    {!salaryGoodsGroup.isCollapsed && (
                      <div className="bg-white">
                        {salaryGoodsGroup.workTypeGroups.map((workTypeGroup) => (
                          <div key={`${salaryGoodsGroup.salaryGoods}_${workTypeGroup.workType}`} className="border-b border-gray-200 last:border-b-0">
                            {/* Заголовок статьи работ с кнопками добавления */}
                            <div className="w-full pl-6 pr-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors">
                              <button
                                onClick={() => toggleWorkTypeCollapse(salaryGoodsGroup.salaryGoods, workTypeGroup.workType)}
                                className="flex items-center space-x-2 flex-1"
                              >
                                <span className="font-medium text-gray-900 text-sm">
                                  {workTypeGroup.workType}
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                  {workTypeGroup.items.length}
                                </span>
                              </button>
                              
                              <div className="flex items-center space-x-2">
                                {/* Кнопки добавления новых карточек */}
                                {workTypeGroup.items.length > 0 && (
                                  <>
                                    {/* Кнопка добавления обычной карточки */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const templateItem = items.find(item => 
                                          workTypeGroup.items[0].groupedIds.includes(item.id)
                                        );
                                        if (templateItem) {
                                          handleAddNewItem(templateItem);
                                        }
                                      }}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                      title="Добавить новую карточку в эту группу"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                    
                                    {salaryGoodsGroup.salaryGoods.toLowerCase().includes('зарплата') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            handleAddEmployeeItem(templateItem);
                                          }
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                        title="Добавить сотрудника из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}

                                    {shouldShowWireButton(salaryGoodsGroup.salaryGoods) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            handleAddWireItem(templateItem);
                                          }
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                        title="Добавить провод из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}

                                    {shouldShowMotorButton(salaryGoodsGroup.salaryGoods, workTypeGroup.workType) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            handleAddMotorItem(templateItem);
                                          }
                                        }}
                                        className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                                        title="Добавить двигатель из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}

                                    {shouldShowBearingButton(workTypeGroup.workType) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            handleAddBearingItem(templateItem);
                                          }
                                        }}
                                        className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                                        title="Добавить подшипник из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                                
                                <button
                                  onClick={() => toggleWorkTypeCollapse(salaryGoodsGroup.salaryGoods, workTypeGroup.workType)}
                                  className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {workTypeGroup.isCollapsed ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            {!workTypeGroup.isCollapsed && (
                              <div className="bg-white space-y-2 p-2 pl-8">
                                {workTypeGroup.items.map((groupedItem) => {
                                  const { hasIncome, hasExpense, incomeItems, expenseItems, totalIncome, totalExpense } = getIncomeExpenseFromGroup(groupedItem, items);
                                  const isBeingDragged = draggedItem?.groupedIds.some(id => groupedItem.groupedIds.includes(id));
                                  
                                  return (
                                    <div 
                                      key={groupedItem.id} 
                                      className={`
                                        border border-gray-200 rounded-lg overflow-hidden cursor-move transition-all duration-200
                                        ${isBeingDragged 
                                          ? 'opacity-50 border-blue-300 shadow-lg transform scale-105' 
                                          : 'hover:border-blue-300 hover:shadow-md'
                                        }
                                      `}
                                      draggable={true}
                                      onDragStart={(e) => handleGroupDragStart(e, groupedItem)}
                                    >
                                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-gray-900 text-sm">
                                            {groupedItem.positionName}
                                          </span>
                                          <div className="flex items-center space-x-1">
                                            {hasIncome && (
                                              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                                Доходы
                                              </span>
                                            )}
                                            {hasExpense && (
                                              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                                Расходы
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onCreatePositionFromGroup) {
                                              onCreatePositionFromGroup(groupedItem);
                                            }
                                          }}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors group bg-white shadow-sm border border-gray-200"
                                          title="Создать позицию из этой группы"
                                        >
                                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                      </div>
                                      
                                      <div className="bg-white">
                                        <div className="p-3 space-y-2">
                                          {hasIncome && (
                                            <div className="flex items-center justify-between text-sm">
                                              <div className="flex items-center space-x-2">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-green-700 font-medium">Доходы</span>
                                              </div>
                                              <span className="text-green-700 font-bold">
                                                {`${(totalIncome / incomeItems.length).toLocaleString('ru-RU')} x ${incomeItems.length} = ${totalIncome.toLocaleString('ru-RU')} ₽`}
                                              </span>
                                            </div>
                                          )}
                                          
                                          {hasExpense && (
                                            <div className="flex items-center justify-between text-sm">
                                              <div className="flex items-center space-x-2">
                                                <TrendingDown className="w-4 h-4 text-red-600" />
                                                <span className="text-red-700 font-medium">Расходы</span>
                                              </div>
                                              <span className="text-red-700 font-bold">
                                                {`${(totalExpense / expenseItems.length).toLocaleString('ru-RU')} x ${expenseItems.length} = ${totalExpense.toLocaleString('ru-RU')} ₽`}
                                              </span>
                                            </div>
                                          )}
                                          
                                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                                            <div className="flex items-center space-x-2">
                                              <Ruble className="w-4 h-4 text-blue-600" />
                                              <span className="text-blue-700 font-medium">Итого</span>
                                            </div>
                                            <span className="text-blue-700 font-bold">
                                              {(totalIncome - totalExpense).toLocaleString('ru-RU')} ₽
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {groupedItems.itemsWithoutSalaryGoods.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">Без категории</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {groupedItems.itemsWithoutSalaryGoods.length}
                      </span>
                    </div>
                    
                    <div className="bg-white space-y-2 p-2">
                      {groupedItems.itemsWithoutSalaryGoods.map((groupedItem) => {
                        const { hasIncome, hasExpense, incomeItems, expenseItems, totalIncome, totalExpense } = getIncomeExpenseFromGroup(groupedItem, items);
                        const isBeingDragged = draggedItem?.groupedIds.some(id => groupedItem.groupedIds.includes(id));
                        
                        return (
                          <div 
                            key={groupedItem.id} 
                            className={`
                              border border-gray-200 rounded-lg overflow-hidden cursor-move transition-all duration-200
                              ${isBeingDragged 
                                ? 'opacity-50 border-blue-300 shadow-lg transform scale-105' 
                                : 'hover:border-blue-300 hover:shadow-md'
                              }
                            `}
                            draggable={true}
                            onDragStart={(e) => handleGroupDragStart(e, groupedItem)}
                          >
                            <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 text-sm">
                                  {groupedItem.positionName}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {hasIncome && (
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                      Доходы
                                    </span>
                                  )}
                                  {hasExpense && (
                                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                      Расходы
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onCreatePositionFromGroup) {
                                    onCreatePositionFromGroup(groupedItem);
                                  }
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors group bg-white shadow-sm border border-gray-200"
                                title="Создать позицию из этой группы"
                              >
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                            
                            <div className="bg-white">
                              <div className="p-3 space-y-2">
                                {hasIncome && (
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <TrendingUp className="w-4 h-4 text-green-600" />
                                      <span className="text-green-700 font-medium">Доходы</span>
                                    </div>
                                    <span className="text-green-700 font-bold">
                                      {`${(totalIncome / incomeItems.length).toLocaleString('ru-RU')} x ${incomeItems.length} = ${totalIncome.toLocaleString('ru-RU')} ₽`}
                                    </span>
                                  </div>
                                )}
                                
                                {hasExpense && (
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <TrendingDown className="w-4 h-4 text-red-600" />
                                      <span className="text-red-700 font-medium">Расходы</span>
                                    </div>
                                    <span className="text-red-700 font-bold">
                                      {`${(totalExpense / expenseItems.length).toLocaleString('ru-RU')} x ${expenseItems.length} = ${totalExpense.toLocaleString('ru-RU')} ₽`}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                                  <div className="flex items-center space-x-2">
                                    <Ruble className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-700 font-medium">Итого</span>
                                  </div>
                                  <span className="text-blue-700 font-bold">
                                    {(totalIncome - totalExpense).toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer for settings */}
        {!isCollapsed && hasGroups && (
          <div className="flex-shrink-0 p-2 border-t border-gray-200">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-2 w-full justify-center transition-colors"
              title="Настроить горячие клавиши"
            >
              <Keyboard className="w-4 h-4" />
              <span>Настроить горячие клавиши</span>
            </button>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Добавить новую карточку
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название новой позиции:
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Например: Оплата труда обмотчика"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              {selectedTemplateItem && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Шаблон:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedTemplateItem.analytics8}
                  </p>
                  <p className="text-xs text-gray-500">
                    Статья работ: {selectedTemplateItem.workType}
                  </p>
                  <p className="text-xs text-gray-500">
                    Категория: {selectedTemplateItem.salaryGoods}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancelAddItem}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateNewItem}
                  disabled={!newItemName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmployeeSelector && employeeTemplateItem && (
          <EmployeeSelector
            onSelect={handleEmployeeSelected}
            onCancel={handleCancelEmployeeSelection}
            templateWorkType={employeeTemplateItem.workType}
            templateSalaryGoods={employeeTemplateItem.salaryGoods}
          />
        )}

        {showWireSelector && wireTemplateItem && (
          <WireSelector
            onSelect={handleWireSelected}
            onCancel={handleCancelWireSelection}
            templateWorkType={wireTemplateItem.workType}
            templateSalaryGoods={wireTemplateItem.salaryGoods}
          />
        )}

        {showMotorSelector && motorTemplateItem && (
          <MotorSelector
            onSelect={handleMotorSelected}
            onCancel={handleCancelMotorSelection}
            templateWorkType={motorTemplateItem.workType}
            templateSalaryGoods={motorTemplateItem.salaryGoods}
          />
        )}

        {showBearingSelector && bearingTemplateItem && (
          <BearingSelector
            onSelect={handleBearingSelected}
            onCancel={handleCancelBearingSelection}
            templateWorkType={bearingTemplateItem.workType}
            templateSalaryGoods={bearingTemplateItem.salaryGoods}
          />
        )}
      </div>
      <HotkeySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        hotkeys={hotkeys}
        onUpdateHotkey={updateHotkey}
      />
    </>
  );
};
