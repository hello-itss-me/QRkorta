import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './utils/supabaseClient';
import Auth from './components/Auth';
import { RepairItem, Position, GroupedRepairItem, Employee, Wire, Motor, Bearing, Counterparty, SavedPosition, UpdDocument, IndividualEmployee } from './types';
import { UnallocatedItemsPanel } from './components/UnallocatedItemsPanel';
import PositionCard from './components/PositionCard';
import { ImportButton } from './components/ImportButton';
import { ExportToSupabaseButton } from './components/ExportToSupabaseButton';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useSearch } from './hooks/useSearch';
import { exportToCSV } from './utils/csvExport';
import { getBasePositionName, groupSimilarItems, ungroupItems, groupByBasePositionName } from './utils/groupingUtils';
import { Plus, Download, Settings, TrendingUp, TrendingDown, Users, Archive, LogOut, FileText, LayoutTemplate, Keyboard } from 'lucide-react';
import UpdDocumentEditor from './components/UpdDocumentEditor';
import { BearingReplacer } from './components/BearingReplacer';
import { MotorReplacer } from './components/MotorReplacer';
import { WireReplacer } from './components/WireReplacer';
import { EmployeeReplacer } from './components/EmployeeReplacer';
import { NewItemForm } from './components/NewItemForm';
import { NewWorkGroupForm } from './components/NewWorkGroupForm';
import CounterpartyWidget from './components/CounterpartyWidget';
import { CounterpartySelector } from './components/CounterpartySelector';
import SavedPositionsViewer from './components/SavedPositionsViewer';
import { UpdDocumentSelector } from './components/UpdDocumentSelector';
import { SaveTemplateButton } from './components/SaveTemplateButton';
import TemplateSelector from './components/TemplateSelector';
import { HotkeySettingsModal } from './components/HotkeySettingsModal';
import { HotkeyAction, HotkeyMap } from './hooks/useHotkeys';
import QrCodeDetailsViewer from './components/QrCodeDetailsViewer'; // Импортируем новый компонент

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [unallocatedItems, setUnallocatedItems] = useState<RepairItem[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [nextPositionNumber, setNextPositionNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUpdDocument, setSelectedUpdDocument] = useState<UpdDocument | null>(null); // Изменено на UpdDocument | null
  const [itemToReplace, setItemToReplace] = useState<{ positionId: string; item: GroupedRepairItem } | null>(null);
  const [motorItemToReplace, setMotorItemToReplace] = useState<{ positionId: string; item: GroupedRepairItem } | null>(null);
  const [wireItemToReplace, setWireItemToReplace] = useState<{ positionId: string; item: GroupedRepairItem } | null>(null);
  const [employeeItemToReplace, setEmployeeItemToReplace] = useState<{ positionId: string; item: GroupedRepairItem } | null>(null);
  const [newItemFormState, setNewItemFormState] = useState<{ positionId: string; workType: string } | null>(null);
  const [newWorkGroupFormState, setNewWorkGroupFormState] = useState<{ positionId: string } | null>(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [isCounterpartySelectorOpen, setIsCounterpartySelectorOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUpdSelectorOpen, setIsUpdSelectorOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isHotkeySettingsOpen, setIsHotkeySettingsOpen] = useState(false);
  const [qrDetailsPositionId, setQrDetailsPositionId] = useState<string | null>(null); // Состояние для просмотра деталей QR
  const [hotkeys, setHotkeys] = useState<HotkeyMap>({
    toggleLevel1: 'Alt+1',
    toggleLevel2: 'Alt+2',
  });

  const handleUpdateHotkey = (action: HotkeyAction, key: string) => {
    setHotkeys(prev => ({ ...prev, [action]: key }));
    // Here you would typically save the hotkeys to localStorage
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Check URL for QR code details view
    const path = window.location.pathname;
    if (path.startsWith('/qr-view/')) {
      const id = path.split('/qr-view/')[1];
      if (id) {
        setQrDetailsPositionId(id);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const {
    draggedItem,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDropToUnallocated
  } = useDragAndDrop(unallocatedItems); // Передаем unallocatedItems в хук

  const { filteredUnallocatedItems } = useSearch(
    unallocatedItems,
    positions,
    searchQuery
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      // Clear all state on logout
      setUnallocatedItems([]);
      setPositions([]);
      setNextPositionNumber(1);
      setSearchQuery('');
      setSelectedUpdDocument(null); // Обновлено
      setSelectedCounterparty(null);
      setItemToReplace(null);
      setMotorItemToReplace(null);
      setWireItemToReplace(null);
      setEmployeeItemToReplace(null);
      setNewItemFormState(null);
      setNewWorkGroupFormState(null);
      setQrDetailsPositionId(null); // Clear QR details state
    }
  };

  const createNewPosition = () => {
    const newPosition: Position = {
      id: `position-${Date.now()}`,
      service: 'Нажмите для ввода услуги',
      positionNumber: nextPositionNumber,
      items: [],
      totalPrice: 0,
      totalIncome: 0,
      totalExpense: 0,
    };
    
    setPositions([...positions, newPosition]);
    setNextPositionNumber(nextPositionNumber + 1);
  };

  const recalculatePositionTotals = (items: RepairItem[]) => {
    const totalPrice = items.reduce((sum, item) => sum + item.revenue, 0);
    const totalIncome = items
      .filter(item => item.incomeExpenseType === 'Доходы')
      .reduce((sum, item) => sum + item.revenue, 0);
    const totalExpense = items
      .filter(item => item.incomeExpenseType === 'Расходы')
      .reduce((sum, item) => sum + Math.abs(item.revenue), 0);
    
    return { totalPrice, totalIncome, totalExpense };
  };

  const createPositionsFromGroup = (groupedItem: GroupedRepairItem) => {
    const groupItems = ungroupItems(groupedItem, unallocatedItems);
    
    if (groupItems.length === 0) {
      alert('Не найдены элементы для создания позиций');
      return;
    }

    const newPositions: Position[] = [];
    let currentPositionNumber = nextPositionNumber;

    groupItems.forEach((item) => {
      const totals = recalculatePositionTotals([item]);
      const basePositionName = getBasePositionName(item.positionName);
      
      const newPosition: Position = {
        id: `position-${Date.now()}-${currentPositionNumber}`,
        service: basePositionName,
        positionNumber: currentPositionNumber,
        items: [item],
        ...totals
      };

      newPositions.push(newPosition);
      currentPositionNumber++;
    });

    setPositions(prevPositions => [...prevPositions, ...newPositions]);
    setNextPositionNumber(currentPositionNumber);
    
    setUnallocatedItems(prevItems => 
      prevItems.filter(item => !groupedItem.groupedIds.includes(item.id))
    );

    console.log(`Создано ${newPositions.length} отдельных позиций для "${groupedItem.positionName}"`);
  };

  const createCombinedPositionFromGroup = (groupedItem: GroupedRepairItem) => {
    const basePositionName = getBasePositionName(groupedItem.positionName);
    
    const allRelatedItems = unallocatedItems.filter(item => 
      getBasePositionName(item.positionName) === basePositionName
    );
    
    if (allRelatedItems.length === 0) {
      alert('Не найдены элементы для создания позиции');
      return;
    }

    const totals = recalculatePositionTotals(allRelatedItems);
    
    const newPosition: Position = {
      id: `position-${Date.now()}`,
      service: basePositionName,
      positionNumber: nextPositionNumber,
      items: allRelatedItems,
      ...totals
    };

    setPositions(prevPositions => [...prevPositions, newPosition]);
    setNextPositionNumber(nextPositionNumber + 1);
    
    setUnallocatedItems(prevItems => 
      prevItems.filter(item => 
        getBasePositionName(item.positionName) !== basePositionName
      )
    );

    console.log(`Создана объединенная позиция "${basePositionName}" с ${allRelatedItems.length} элементами`);
  };

  const handlePriceChange = (positionId: string, itemId: string, newRevenue: number) => {
    setPositions(prevPositions => 
      prevPositions.map(position => {
        if (position.id === positionId) {
          const updatedItems = position.items.map(item => {
            if (item.id === itemId) {
              let newSumWithoutVAT, newVatAmount;
              if (item.revenue !== 0) {
                const vatRatio = item.vatAmount / item.revenue;
                const withoutVatRatio = item.sumWithoutVAT / item.revenue;
                newVatAmount = newRevenue * vatRatio;
                newSumWithoutVAT = newRevenue * withoutVatRatio;
              } else {
                newSumWithoutVAT = newRevenue * 0.8;
                newVatAmount = newRevenue * 0.2;
              }

              return {
                ...item,
                revenue: newRevenue,
                sumWithoutVAT: newSumWithoutVAT,
                vatAmount: newVatAmount
              };
            }
            return item;
          });

          const totals = recalculatePositionTotals(updatedItems);
          
          return {
            ...position,
            items: updatedItems,
            ...totals
          };
        }
        return position;
      })
    );
  };

  const handleEmployeeHoursChange = (positionId: string, itemId: string, newHours: number) => {
    setPositions(prevPositions => 
      prevPositions.map(position => {
        if (position.id === positionId) {
          const updatedItems = position.items.map(item => {
            if (item.id === itemId) {
              const isEmployeeCard = item.positionName.toLowerCase().includes('оплата труда') && 
                                   item.incomeExpenseType === 'Расходы' &&
                                   item.salaryGoods.toLowerCase().includes('зарплата');
              
              if (!isEmployeeCard) return item;

              const match = item.positionName.match(/оплата труда (\w+) \((\d+(?:\.\d+)?)\s*ч\)/i);
              if (!match) return item;

              const employeeName = match[1];
              const oldHours = parseFloat(match[2]);
              const hourlyRate = oldHours > 0 ? Math.abs(item.revenue) / oldHours : 0;
              if (hourlyRate <= 0) return item;

              const newTotalAmount = hourlyRate * newHours;
              const newRevenue = -newTotalAmount;
              const newSumWithoutVAT = newRevenue;
              const newVatAmount = 0;

              const newPositionName = item.positionName.replace(/\((\d+(?:\.\d+)?)\s*ч\)/i, `(${newHours} ч)`);
              const newAnalytics8 = item.analytics8.replace(/\((\d+(?:\.\d+)?)\s*ч\)/i, `(${newHours} ч)`);

              return {
                ...item,
                positionName: newPositionName,
                analytics8: newAnalytics8,
                quantity: newHours,
                revenue: newRevenue,
                sumWithoutVAT: newSumWithoutVAT,
                vatAmount: newVatAmount
              };
            }
            return item;
          });

          const totals = recalculatePositionTotals(updatedItems);
          
          return {
            ...position,
            items: updatedItems,
            ...totals
          };
        }
        return position;
      })
    );
  };

  const updatePositionService = (positionId: string, newService: string) => {
    setPositions(positions.map(position => 
      position.id === positionId 
        ? { ...position, service: newService }
        : position
    ));
  };

  const deletePosition = (positionId: string) => {
    const positionToDelete = positions.find(p => p.id === positionId);
    if (positionToDelete) {
      setUnallocatedItems([...unallocatedItems, ...positionToDelete.items]);
      
      const updatedPositions = positions
        .filter(p => p.id !== positionId)
        .map((pos, i) => ({ ...pos, positionNumber: i + 1 }));
      
      setPositions(updatedPositions);
      setNextPositionNumber(updatedPositions.length + 1);
    }
  };

  const handleClonePosition = (positionId: string) => {
    const positionToClone = positions.find(p => p.id === positionId);
    if (!positionToClone) return;

    const newItems = positionToClone.items.map(item => {
      const newId = `cloned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const oldIdMatch = item.positionName.match(/_ID_([a-zA-Z0-9-]+)$/);
      const newPositionName = oldIdMatch
        ? item.positionName.replace(oldIdMatch[0], `_ID_${newId}`)
        : `${item.positionName}_ID_${newId}`;

      return {
        ...item,
        id: newId,
        positionName: newPositionName,
        uniqueKey: `${newId}-${item.analytics8.toLowerCase().replace(/\s+/g, '-')}`
      };
    });

    const totals = recalculatePositionTotals(newItems);

    const newPosition: Position = {
      id: `position-${Date.now()}`,
      service: `${positionToClone.service} (копия)`,
      positionNumber: 0, // Placeholder
      items: newItems,
      ...totals
    };

    setPositions(prevPositions => {
      const index = prevPositions.findIndex(p => p.id === positionId);
      const insertIndex = index !== -1 ? index + 1 : prevPositions.length;
      
      const updatedPositions = [...prevPositions];
      updatedPositions.splice(insertIndex, 0, newPosition);

      return updatedPositions.map((pos, i) => ({
        ...pos,
        positionNumber: i + 1
      }));
    });

    setNextPositionNumber(prev => prev + 1);
  };

  const handlePositionDrop = (targetPositionId: string) => {
    handleDrop(targetPositionId, positions, setPositions, setUnallocatedItems);
  };

  const handleUnallocatedDrop = () => {
    handleDropToUnallocated(positions, setPositions, setUnallocatedItems);
  };

  const handleExport = () => {
    if (positions.length === 0) {
      alert('Нет позиций для экспорта');
      return;
    }
    exportToCSV(positions);
  };

  const handleImport = (importedItems: RepairItem[]) => {
    setUnallocatedItems(prevItems => [...prevItems, ...importedItems]);
    const firstItemWithUpd = importedItems.find(item => item.analytics1 && item.analytics1.trim() !== '');
    if (firstItemWithUpd && !selectedUpdDocument) { // Обновлено
        setSelectedUpdDocument({ // Создаем временный объект UpdDocument
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          counterparty_name: '', // Будет заполнено при выборе контрагента
          document_name: firstItemWithUpd.analytics1,
          document_date: null,
          contract: null,
          status: null,
          is_active: true,
        });
    }
  };

  const handleUpdateUpdDocument = (newDocumentName: string) => {
    setSelectedUpdDocument(prev => prev ? { ...prev, document_name: newDocumentName } : null); // Обновлено
  };

  const handleSelectUpdDocument = (doc: UpdDocument) => {
    setSelectedUpdDocument(doc); // Сохраняем полный объект UpdDocument
    setIsUpdSelectorOpen(false);
  };

  const handleClearAll = () => {
    if (confirm('Вы уверены, что хотите очистить все данные?')) {
      setUnallocatedItems([]);
      setPositions([]);
      setNextPositionNumber(1);
      setSelectedUpdDocument(null); // Обновлено
      setSelectedCounterparty(null); // Clear selected counterparty too
    }
  };

  const handleAddNewItem = (templateItem: RepairItem, newName: string) => {
    const newId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: RepairItem = {
      ...templateItem,
      id: newId,
      uniqueKey: `${newId}-${newName.toLowerCase().replace(/\s+/g, '-')}`,
      positionName: `${newName}_ID_${newId}`,
      analytics8: newName,
      revenue: 0,
      sumWithoutVAT: 0,
      vatAmount: 0,
      quantity: 1
    };
    setUnallocatedItems(prevItems => [...prevItems, newItem]);
  };

  const handleAddEmployeeItem = (templateItem: RepairItem, employee: IndividualEmployee, hours: number) => {
    const newId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = employee.hourly_rate * hours;
    const newItem: RepairItem = {
      ...templateItem,
      id: newId,
      uniqueKey: `${newId}-${employee.full_name.toLowerCase().replace(/\s+/g, '-')}-${hours}h`,
      positionName: `Оплата труда ${employee.full_name.toLowerCase()} (${hours} ч)_ID_${newId}`,
      analytics8: `Оплата труда ${employee.full_name.toLowerCase()} (${hours} ч)`,
      revenue: -totalAmount,
      sumWithoutVAT: -totalAmount,
      vatAmount: 0,
      quantity: hours,
      incomeExpenseType: 'Расходы'
    };
    setUnallocatedItems(prevItems => [...prevItems, newItem]);
  };

  const handleAddWireItem = (templateItem: RepairItem, wire: Wire, length: number) => {
    const newId = `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = wire.price_per_meter * length;
    const newItem: RepairItem = {
      ...templateItem,
      id: newId,
      uniqueKey: `${newId}-${wire.brand.toLowerCase().replace(/\s+/g, '-')}-${wire.cross_section}mm-${length}m`,
      positionName: `${wire.brand} ${wire.cross_section} мм² (${length} м)_ID_${newId}`,
      analytics8: `${wire.brand} ${wire.cross_section} мм² (${length} м)`,
      revenue: totalAmount,
      sumWithoutVAT: totalAmount * 0.8,
      vatAmount: totalAmount * 0.2,
      quantity: length,
      incomeExpenseType: 'Расходы'
    };
    setUnallocatedItems(prevItems => [...prevItems, newItem]);
  };

  const handleAddMotorItem = (templateItem: RepairItem, motor: Motor, quantity: number) => {
    const newId = `motor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = motor.price_per_unit * quantity;
    const newItem: RepairItem = {
      ...templateItem,
      id: newId,
      uniqueKey: `${newId}-${motor.name.toLowerCase().replace(/\s+/g, '-')}-${motor.power_kw}kw-${motor.rpm}rpm-${quantity}pcs`,
      positionName: `Ремонт электродвигателя ${motor.name} ${motor.power_kw}кВт*${motor.rpm} об/мин (${quantity} шт)_ID_${newId}`,
      analytics8: `Ремонт электродвигателя ${motor.name} ${motor.power_kw}кВт*${motor.rpm} об/мин (${quantity} шт)`,
      revenue: totalAmount,
      sumWithoutVAT: totalAmount * 0.8,
      vatAmount: totalAmount * 0.2,
      quantity: quantity,
      incomeExpenseType: 'Доходы'
    };
    setUnallocatedItems(prevItems => [...prevItems, newItem]);
  };

  const handleAddBearingItem = (templateItem: RepairItem, bearing: Bearing, quantity: number) => {
    const newId = `bearing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = bearing.price_per_unit * quantity;
    const newItem: RepairItem = {
      ...templateItem,
      id: newId,
      uniqueKey: `${newId}-${bearing.designation.toLowerCase().replace(/\s+/g, '-')}-${quantity}pcs`,
      positionName: `Замена подшипника ${bearing.designation} (${quantity} шт)_ID_${newId}`,
      analytics8: `Замена подшипника ${bearing.designation} (${quantity} шт)`,
      revenue: totalAmount,
      sumWithoutVAT: totalAmount * 0.8,
      vatAmount: totalAmount * 0.2,
      quantity: quantity,
      incomeExpenseType: 'Расходы'
    };
    setUnallocatedItems(prevItems => [...prevItems, newItem]);
  };

  const handleQuantityChange = (positionId: string, groupedItem: GroupedRepairItem, newQuantity: number) => {
    const currentQuantity = groupedItem.groupedIds.length;
    const basePositionName = getBasePositionName(groupedItem.positionName);
    
    if (newQuantity > currentQuantity) {
      const itemsToAdd = newQuantity - currentQuantity;
      const availableItems = unallocatedItems.filter(item => 
        getBasePositionName(item.positionName) === basePositionName &&
        item.incomeExpenseType === groupedItem.incomeExpenseType
      );
      
      if (availableItems.length < itemsToAdd) {
        alert(`Недостаточно доступных элементов. Доступно: ${availableItems.length}`);
        return;
      }
      
      const itemsToMove = availableItems.slice(0, itemsToAdd);
      
      setUnallocatedItems(prevItems => 
        prevItems.filter(item => !itemsToMove.some(moveItem => moveItem.id === item.id))
      );
      
      setPositions(prevPositions => 
        prevPositions.map(position => {
          if (position.id === positionId) {
            const newItems = [...position.items, ...itemsToMove];
            const totals = recalculatePositionTotals(newItems);
            return { ...position, items: newItems, ...totals };
          }
          return position;
        })
      );
    } else if (newQuantity < currentQuantity) {
      const itemsToRemoveCount = currentQuantity - newQuantity;
      const position = positions.find(p => p.id === positionId);
      if (!position) return;
      
      const itemsWithSameName = position.items.filter(item => 
        getBasePositionName(item.positionName) === basePositionName
      );
      
      const incomeItems = itemsWithSameName.filter(item => item.incomeExpenseType === 'Доходы');
      const expenseItems = itemsWithSameName.filter(item => item.incomeExpenseType === 'Расходы');
      
      let itemsToMoveBack: RepairItem[] = [];
      
      if (incomeItems.length > 0 && expenseItems.length > 0) {
        const incomeToRemove = Math.min(itemsToRemoveCount, incomeItems.length);
        const expenseToRemove = Math.min(itemsToRemoveCount, expenseItems.length);
        itemsToMoveBack = [...incomeItems.slice(-incomeToRemove), ...expenseItems.slice(-expenseToRemove)];
      } else {
        itemsToMoveBack = itemsWithSameName.slice(-itemsToRemoveCount);
      }
      
      setUnallocatedItems(prevUnallocated => [...prevUnallocated, ...itemsToMoveBack]);
      
      setPositions(prevPositions => 
        prevPositions.map(pos => {
          if (pos.id === positionId) {
            const remainingItems = pos.items.filter(item => !itemsToMoveBack.some(removeItem => removeItem.id === item.id));
            const totals = recalculatePositionTotals(remainingItems);
            return { ...pos, items: remainingItems, ...totals };
          }
          return pos;
        })
      );
    }
  };

  const handleReturnGroupToUnallocated = (positionId: string, itemIdsToReturn: string[]) => {
    let itemsToMoveBack: RepairItem[] = [];
    const newPositions = positions.map(pos => {
      if (pos.id === positionId) {
        itemsToMoveBack = pos.items.filter(item => itemIdsToReturn.includes(item.id));
        const remainingItems = pos.items.filter(item => !itemIdsToReturn.includes(item.id));
        const totals = recalculatePositionTotals(remainingItems);
        return { ...pos, items: remainingItems, ...totals };
      }
      return pos;
    }).filter(pos => pos.items.length > 0); 

    setUnallocatedItems(prevUnallocated => [...prevUnallocated, ...itemsToMoveBack]);
    setPositions(newPositions);
  };

  const handleIncreaseQuantityUnallocated = (groupedItem: GroupedRepairItem) => {
    console.log('Увеличение количества в неразмещенных не требуется');
  };

  const handleShowReplacer = (positionId: string, item: GroupedRepairItem) => {
    const name = item.positionName.toLowerCase();
    if (name.includes('подшипника')) {
      setItemToReplace({ positionId, item });
    } else if (name.includes('двигателя')) {
      setMotorItemToReplace({ positionId, item });
    } else if (name.includes('провод')) {
      setWireItemToReplace({ positionId, item });
    } else if (name.includes('оплата труда')) {
      setEmployeeItemToReplace({ positionId, item });
    }
  };

  const handleReplaceBearing = (newBearing: Bearing) => {
    if (!itemToReplace) return;

    const { positionId, item: oldItemGroup } = itemToReplace;

    setPositions(prevPositions =>
      prevPositions.map(pos => {
        if (pos.id === positionId) {
          const updatedItems = pos.items.map(itemInPosition => {
            if (oldItemGroup.groupedIds.includes(itemInPosition.id)) {
              const quantity = itemInPosition.quantity;
              const totalAmount = newBearing.price_per_unit * quantity;

              const newPositionName = `Замена подшипника ${newBearing.designation} (${quantity} шт)_ID_${itemInPosition.id}`;
              const newAnalytics8 = `Замена подшипника ${newBearing.designation} (${quantity} шт)`;

              const newRevenue = itemInPosition.incomeExpenseType === 'Расходы' ? -totalAmount : totalAmount;
              
              const newSumWithoutVAT = newRevenue * 0.8;
              const newVatAmount = newRevenue * 0.2;

              return {
                ...itemInPosition,
                positionName: newPositionName,
                analytics8: newAnalytics8,
                revenue: newRevenue,
                sumWithoutVAT: newSumWithoutVAT,
                vatAmount: newVatAmount,
                uniqueKey: `${itemInPosition.id}-${newBearing.designation.toLowerCase().replace(/\s+/g, '-')}-${quantity}pcs`,
              };
            }
            return itemInPosition;
          });

          const totals = recalculatePositionTotals(updatedItems);
          return { ...pos, items: updatedItems, ...totals };
        }
        return pos;
      })
    );

    setItemToReplace(null);
  };

  const handleReplaceMotor = (newMotor: Motor) => {
    if (!motorItemToReplace) return;

    const { positionId, item: oldItemGroup } = motorItemToReplace;

    setPositions(prevPositions =>
      prevPositions.map(pos => {
        if (pos.id === positionId) {
          const updatedItems = pos.items.map(itemInPosition => {
            if (oldItemGroup.groupedIds.includes(itemInPosition.id)) {
              const quantity = itemInPosition.quantity;
              const totalAmount = newMotor.price_per_unit * quantity;

              const newPositionName = `Ремонт электродвигателя ${newMotor.name} ${newMotor.power_kw}кВт*${newMotor.rpm} об/мин (${quantity} шт)_ID_${itemInPosition.id}`;
              const newAnalytics8 = `Ремонт электродвигателя ${newMotor.name} ${newMotor.power_kw}кВт*${newMotor.rpm} об/мин (${quantity} шт)`;

              const newRevenue = itemInPosition.incomeExpenseType === 'Доходы' ? totalAmount : -totalAmount;
              
              const newSumWithoutVAT = newRevenue * 0.8;
              const newVatAmount = newRevenue * 0.2;

              return {
                ...itemInPosition,
                positionName: newPositionName,
                analytics8: newAnalytics8,
                revenue: newRevenue,
                sumWithoutVAT: newSumWithoutVAT,
                vatAmount: newVatAmount,
                uniqueKey: `${itemInPosition.id}-${newMotor.name.toLowerCase().replace(/\s+/g, '-')}-${quantity}pcs`,
              };
            }
            return itemInPosition;
          });

          const totals = recalculatePositionTotals(updatedItems);
          return { ...pos, items: updatedItems, ...totals };
        }
        return pos;
      })
    );

    setMotorItemToReplace(null);
  };

  const handleReplaceWire = (newWire: Wire, length: number) => {
    if (!wireItemToReplace) return;

    const { positionId, item: oldItemGroup } = wireItemToReplace;

    setPositions(prevPositions =>
      prevPositions.map(pos => {
        if (pos.id === positionId) {
          const updatedItems = pos.items.map(itemInPosition => {
            if (oldItemGroup.groupedIds.includes(itemInPosition.id)) {
              const totalAmount = newWire.price_per_meter * length;

              const newPositionName = `${newWire.brand} ${newWire.cross_section} мм² (${length} м)_ID_${itemInPosition.id}`;
              const newAnalytics8 = `${newWire.brand} ${newWire.cross_section} мм² (${length} м)`;

              const newRevenue = -totalAmount;
              
              const newSumWithoutVAT = newRevenue * 0.8;
              const newVatAmount = newRevenue * 0.2;

              return {
                ...itemInPosition,
                positionName: newPositionName,
                analytics8: newAnalytics8,
                revenue: newRevenue,
                sumWithoutVAT: newSumWithoutVAT,
                vatAmount: newVatAmount,
                quantity: length,
                uniqueKey: `${itemInPosition.id}-${newWire.brand.toLowerCase().replace(/\s+/g, '-')}-${length}m`,
              };
            }
            return itemInPosition;
          });

          const totals = recalculatePositionTotals(updatedItems);
          return { ...pos, items: updatedItems, ...totals };
        }
        return pos;
      })
    );

    setWireItemToReplace(null);
  };

  const handleReplaceEmployee = (newEmployee: IndividualEmployee, hours: number) => {
    if (!employeeItemToReplace) return;

    const { positionId, item: oldItemGroup } = employeeItemToReplace;

    setPositions(prevPositions =>
      prevPositions.map(pos => {
        if (pos.id === positionId) {
          const updatedItems = pos.items.map(itemInPosition => {
            if (oldItemGroup.groupedIds.includes(itemInPosition.id)) {
              const totalAmount = newEmployee.hourly_rate * hours;
              const newRevenue = -totalAmount;

              const newPositionName = `Оплата труда ${newEmployee.full_name.toLowerCase()} (${hours} ч)_ID_${itemInPosition.id}`;
              const newAnalytics8 = `Оплата труда ${newEmployee.full_name.toLowerCase()} (${hours} ч)`;

              return {
                ...itemInPosition,
                positionName: newPositionName,
                analytics8: newAnalytics8,
                revenue: newRevenue,
                sumWithoutVAT: newRevenue,
                vatAmount: 0,
                quantity: hours,
                uniqueKey: `${itemInPosition.id}-${newEmployee.full_name.toLowerCase().replace(/\s+/g, '-')}-${hours}h`,
              };
            }
            return itemInPosition;
          });

          const totals = recalculatePositionTotals(updatedItems);
          return { ...pos, items: updatedItems, ...totals };
        }
        return pos;
      })
    );

    setEmployeeItemToReplace(null);
  };

  const handleCreateNewItemInPosition = (data: { name: string; price: number; type: 'Доходы' | 'Расходы'; quantity: number; description: string; }) => {
    if (!newItemFormState) return;
    const { positionId, workType } = newItemFormState;

    const newId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = data.price * data.quantity;
    const revenue = data.type === 'Доходы' ? totalAmount : -totalAmount;
    
    const sumWithoutVAT = revenue * 0.8;
    const vatAmount = revenue * 0.2;

    const newItem: RepairItem = {
      id: newId,
      uniqueKey: `${newId}-${data.name.toLowerCase().replace(/\s+/g, '-')}`,
      positionName: `${data.name}_ID_${newId}`,
      analytics8: data.name,
      workType: workType,
      incomeExpenseType: data.type,
      revenue: revenue,
      sumWithoutVAT: sumWithoutVAT,
      vatAmount: vatAmount,
      quantity: data.quantity,
      salaryGoods: 'Товары',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}`,
      date: new Date().toISOString().split('T')[0],
      analytics1: selectedUpdDocument?.document_name || '', // Обновлено
      analytics2: data.description,
      analytics3: '',
      analytics4: '',
      analytics5: '',
      analytics6: '',
      analytics7: '',
      debitAccount: '',
      creditAccount: '',
    };

    setPositions(prevPositions =>
      prevPositions.map(pos => {
        if (pos.id === positionId) {
          const updatedItems = [...pos.items, newItem];
          const totals = recalculatePositionTotals(updatedItems);
          return { ...pos, items: updatedItems, ...totals };
        }
        return pos;
      })
    );

    setNewItemFormState(null);
  };

  const handleShowNewWorkGroupForm = (positionId: string) => {
    setNewWorkGroupFormState({ positionId });
  };

  const handleSaveNewWorkGroup = (workTypeName: string) => {
    if (!newWorkGroupFormState) return;
    
    const { positionId } = newWorkGroupFormState;
    
    const position = positions.find(p => p.id === positionId);
    if (position && position.items.some(item => item.workType === workTypeName)) {
        alert(`Группа работ с названием "${workTypeName}" уже существует в этой позиции.`);
        return;
    }

    setNewWorkGroupFormState(null);
    setNewItemFormState({ positionId, workType: workTypeName });
  };

  const handleSelectCounterparty = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    // Если выбран контрагент, и есть временный UPD документ из импорта,
    // обновляем его counterparty_name
    setSelectedUpdDocument(prev => {
      if (prev && prev.id.startsWith('temp-')) {
        return { ...prev, counterparty_name: counterparty.name };
      }
      return prev;
    });
    setIsCounterpartySelectorOpen(false);
  };

  const handleLoadPositionsForEditing = (positionsToLoad: SavedPosition[], allItems: RepairItem[][]) => {
    if (positions.length > 0 || unallocatedItems.length > 0) {
        if (!window.confirm('Загрузка данных из архива приведет к потере текущей работы. Продолжить?')) {
            return;
        }
    }

    const newPositions: Position[] = positionsToLoad
      .map((pos, index) => {
        const items = allItems[index];
        if (!items) return null;
        const totals = recalculatePositionTotals(items);
        return {
            id: `loaded-${pos.id}-${Date.now()}-${index}`,
            originalId: pos.id, // Сохраняем оригинальный ID из БД
            service: pos.service,
            positionNumber: pos.position_number,
            items: items,
            ...totals
        };
      })
      .filter((p): p is Position => p !== null)
      .sort((a, b) => a.positionNumber - b.positionNumber)
      .map((p, i) => ({ ...p, positionNumber: i + 1 }));

    const firstPosition = positionsToLoad[0];
    
    // Создаем объект UpdDocument из загруженных данных
    const loadedUpdDocument: UpdDocument | null = firstPosition ? {
        id: `temp-loaded-${Date.now()}`, // Временный ID для загруженного документа
        created_at: new Date().toISOString(),
        counterparty_name: firstPosition.counterparty_name || '',
        document_name: firstPosition.document_new || '',
        document_date: null, // Если нет в SavedPosition, оставляем null
        contract: null, // Если нет в SavedPosition, оставляем null
        status: firstPosition.upd_status || null, // Используем статус из SavedPosition
        is_active: true,
    } : null;

    const tempCounterparty = firstPosition?.counterparty_name ? {
        id: `temp-${Date.now()}`,
        name: firstPosition.counterparty_name,
        inn: null, kpp: null, address: null, contact_person: null, phone: null, email: null, description: null, is_active: true, created_at: '', updated_at: ''
    } : null;

    setPositions(newPositions);
    setUnallocatedItems([]);
    setNextPositionNumber(newPositions.length + 1);
    setSelectedUpdDocument(loadedUpdDocument); // Обновлено
    setSelectedCounterparty(tempCounterparty);
    setIsViewerOpen(false);
    
    alert(`Загружено ${newPositions.length} позиций для редактирования.`);
  };

  const handleLoadSinglePositionForEditing = (positionToLoad: SavedPosition, itemsToLoad: RepairItem[]) => {
    handleLoadPositionsForEditing([positionToLoad], [itemsToLoad]);
  };

  const handleLoadTemplate = (loadedPositions: Position[], loadedUnallocatedItems: RepairItem[]) => {
    if (positions.length > 0 || unallocatedItems.length > 0) {
      if (!window.confirm('Загрузка шаблона приведет к потере текущей работы. Продолжить?')) {
        return;
      }
    }
    setPositions(loadedPositions.map((p, i) => ({ ...p, positionNumber: i + 1, originalId: undefined }))); // Clear originalId for templates
    setUnallocatedItems(loadedUnallocatedItems);
    setNextPositionNumber(loadedPositions.length + 1);
    setSelectedUpdDocument(null); // Обновлено
    setSelectedCounterparty(null); // Clear counterparty for templates
    setIsTemplateSelectorOpen(false);
    alert('Шаблон успешно загружен!');
  };

  const handleSaveSuccess = () => {
    // После успешного сохранения/обновления, очищаем originalId,
    // чтобы следующие сохранения были созданием новых записей, а не обновлением.
    // А также очищаем все данные в интерфейсе
    setPositions([]);
    setUnallocatedItems([]);
    setNextPositionNumber(1);
    setSelectedUpdDocument(null); // Обновлено
    setSelectedCounterparty(null);
  };

  const totalItems = positions.reduce((sum, pos) => sum + pos.items.length, 0);
  const totalValue = positions.reduce((sum, pos) => sum + pos.totalPrice, 0);
  const totalIncome = positions.reduce((sum, pos) => sum + pos.totalIncome, 0);
  const totalExpense = positions.reduce((sum, pos) => sum + pos.totalExpense, 0);
  const groupedUnallocatedItems = groupByBasePositionName(unallocatedItems);
  const groupsCount = groupedUnallocatedItems.length;
  const totalPositionsToCreate = groupedUnallocatedItems.reduce((sum, group) => sum + group.groupedIds.length, 0);

  if (!session) {
    return <Auth />;
  }

  return (
    <>
      <div className="h-screen bg-gray-100 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0 z-10">
          <div className="flex items-center justify-between w-full space-x-6">
            {/* Left & Center */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <CounterpartyWidget
                counterparty={selectedCounterparty}
                onOpenSelector={() => setIsCounterpartySelectorOpen(true)}
              />
              <div className="flex-1 min-w-0 flex items-center space-x-2">
                <UpdDocumentEditor 
                  document={selectedUpdDocument?.document_name || ''} // Обновлено
                  onUpdate={handleUpdateUpdDocument} 
                  isEditable={!selectedUpdDocument} // Обновлено
                  // className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis" // УДАЛЕНО
                />
                <button 
                  onClick={() => setIsUpdSelectorOpen(true)} 
                  className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                  title="Выбрать документ УПД из списка"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="text-sm text-gray-600 flex items-center space-x-3">
                {totalIncome > 0 && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">{totalIncome.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                {totalExpense > 0 && (
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-600">{totalExpense.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                <span className="font-medium text-blue-600">Итого: {totalValue.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setIsViewerOpen(true)} className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-1 rounded-lg hover:bg-yellow-600 transition-colors text-xs">
                  <Archive className="w-3 h-3" />
                  <span>Архив</span>
                </button>
                <button onClick={() => setIsTemplateSelectorOpen(true)} className="flex items-center justify-center bg-orange-500 text-white p-1 rounded-lg hover:bg-orange-600 transition-colors text-xs" title="Выбрать шаблон">
                  <LayoutTemplate className="w-3 h-3" />
                </button>
                <button onClick={createNewPosition} className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs">
                  <Plus className="w-3 h-3" />
                  <span>Позиция</span>
                </button>
                <ExportToSupabaseButton 
                  positions={positions} 
                  selectedUpdDocument={selectedUpdDocument} // Обновлено: передаем полный объект
                  selectedCounterparty={selectedCounterparty} 
                  disabled={isDragging}
                  onSaveSuccess={handleSaveSuccess}
                />
                <SaveTemplateButton
                  positions={positions}
                  disabled={isDragging}
                  onSaveSuccess={() => alert('Шаблон успешно сохранен!')}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <div className="w-96 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
            <UnallocatedItemsPanel
              items={filteredUnallocatedItems}
              onDragStart={handleDragStart}
              onDrop={handleUnallocatedDrop}
              onDragOver={(e) => e.preventDefault()}
              draggedItem={draggedItem}
              draggedFromPositionId={positions.find(p => p.items.some(item => draggedItem?.groupedIds.includes(item.id)))?.id || null}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalUnallocatedCount={unallocatedItems.length}
              onIncreaseQuantity={handleIncreaseQuantityUnallocated}
              onCreatePositionFromGroup={createPositionsFromGroup}
              onAddNewItem={handleAddNewItem}
              onAddEmployeeItem={handleAddEmployeeItem}
              onAddWireItem={handleAddWireItem}
              onAddMotorItem={handleAddMotorItem}
              onAddBearingItem={handleAddBearingItem}
            />
            <div className="p-2 border-t border-gray-200 mt-auto">
              <div className="flex items-center justify-around space-x-1">
                <ImportButton onImport={handleImport} disabled={isDragging} />
                <button onClick={handleExport} disabled={positions.length === 0} className="flex items-center justify-center space-x-1 bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-medium">
                  <Download className="w-3 h-3" />
                  <span>в CSV</span>
                </button>
                <button onClick={() => setIsHotkeySettingsOpen(true)} className="flex items-center justify-center space-x-1 bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium" title="Настроить горячие клавиши">
                  <Keyboard className="w-3 h-3" />
                  <span>Клавиши</span>
                </button>
                <button onClick={handleLogout} className="flex items-center justify-center space-x-1 bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors text-xs font-medium">
                  <LogOut className="w-3 h-3" />
                  <span>Выйти</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <main className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">Собранные позиции</h2>
                    {unallocatedItems.length > 0 && positions.length === 0 && (
                      <div className="text-sm text-gray-500">
                        Неразмещенных позиций: <span className="font-medium text-orange-600">{unallocatedItems.length}</span>
                        {groupsCount > 0 && (
                          <span className="ml-2">
                            • Групп: <span className="font-medium text-purple-600">{groupsCount}</span>
                            • Будет создано: <span className="font-medium text-blue-600">{totalPositionsToCreate}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {positions.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                      <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">Позиции еще не созданы</p>
                      <p className="text-gray-500 mb-4">
                        {unallocatedItems.length > 0 
                          ? groupsCount > 0 
                            ? 'Нажмите стрелку рядом с группой для создания объединенной позиции'
                            : 'Нажмите "Добавить позицию" для создания первой позиции'
                          : 'Импортируйте данные из Excel для начала работы'
                        }
                      </p>
                      {unallocatedItems.length === 0 && (
                        <div className="flex items-center justify-center">
                          <ImportButton onImport={handleImport} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-6">
                  {positions.map((position) => (
                    <PositionCard
                      key={position.id}
                      position={position}
                      onDragStart={handleDragStart}
                      onDrop={handlePositionDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onUpdateService={updatePositionService}
                      onDeletePosition={deletePosition}
                      onClonePosition={handleClonePosition}
                      draggedItem={draggedItem}
                      onQuantityChange={handleQuantityChange}
                      unallocatedItems={unallocatedItems}
                      onPriceChange={handlePriceChange}
                      onEmployeeHoursChange={handleEmployeeHoursChange}
                      onReturnGroupToUnallocated={handleReturnGroupToUnallocated}
                      onReplaceItem={handleShowReplacer}
                      onAddNewItemToWorkGroup={(positionId, workType) => setNewItemFormState({ positionId, workType })}
                      onAddNewWorkGroup={handleShowNewWorkGroupForm}
                    />
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      {itemToReplace && (
        <BearingReplacer
          onSelect={handleReplaceBearing}
          onCancel={() => setItemToReplace(null)}
          currentItem={itemToReplace.item}
        />
      )}
      {motorItemToReplace && (
        <MotorReplacer
          onSelect={handleReplaceMotor}
          onCancel={() => setMotorItemToReplace(null)}
          currentItem={motorItemToReplace.item}
        />
      )}
      {wireItemToReplace && (
        <WireReplacer
          onSelect={handleReplaceWire}
          onCancel={() => setWireItemToReplace(null)}
          currentItem={wireItemToReplace.item}
        />
      )}
      {employeeItemToReplace && (
        <EmployeeReplacer
          onSelect={handleReplaceEmployee}
          onCancel={() => setEmployeeItemToReplace(null)}
          currentItem={employeeItemToReplace.item}
        />
      )}
      {newItemFormState && (
        <NewItemForm
          workType={newItemFormState.workType}
          onSave={handleCreateNewItemInPosition}
          onCancel={() => setNewItemFormState(null)}
        />
      )}
      {newWorkGroupFormState && (
        <NewWorkGroupForm
          onSave={handleSaveNewWorkGroup}
          onCancel={() => setNewWorkGroupFormState(null)}
        />
      )}
      {isCounterpartySelectorOpen && (
        <CounterpartySelector
          onSelect={handleSelectCounterparty}
          onCancel={() => setIsCounterpartySelectorOpen(false)}
        />
      )}
      {isViewerOpen && (
        <SavedPositionsViewer 
            onEdit={handleLoadSinglePositionForEditing}
            onEditDocumentGroup={handleLoadPositionsForEditing}
            onClose={() => setIsViewerOpen(false)}
            onViewQrDetails={(id) => {
              setQrDetailsPositionId(id);
              setIsViewerOpen(false); // Закрываем архив, чтобы открыть детали QR
            }}
        />
      )}
      {isUpdSelectorOpen && (
        <UpdDocumentSelector
          onSelect={handleSelectUpdDocument}
          onCancel={() => setIsUpdSelectorOpen(false)}
          selectedCounterparty={selectedCounterparty} // Передаем выбранного контрагента
        />
      )}
      {isTemplateSelectorOpen && (
        <TemplateSelector
          onSelect={handleLoadTemplate}
          onClose={() => setIsTemplateSelectorOpen(false)}
        />
      )}
      {isHotkeySettingsOpen && (
        <HotkeySettingsModal
          isOpen={isHotkeySettingsOpen}
          onClose={() => setIsHotkeySettingsOpen(false)}
          hotkeys={hotkeys}
          onUpdateHotkey={handleUpdateHotkey}
        />
      )}
      {qrDetailsPositionId && (
        <QrCodeDetailsViewer
          positionId={qrDetailsPositionId}
          onClose={() => {
            setQrDetailsPositionId(null);
            // Optionally, navigate back to the main view or a specific route
            window.history.pushState({}, '', '/'); // Reset URL
          }}
        />
      )}
    </>
  );
}

export default App;
