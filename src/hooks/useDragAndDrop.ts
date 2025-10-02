import { useState, useCallback } from 'react';
import { RepairItem, Position, GroupedRepairItem } from '../types';
import { ungroupItems } from '../utils/groupingUtils';
import { recalculatePositionTotals } from '../utils/positionUtils';

export const useDragAndDrop = (unallocatedItems: RepairItem[]) => { // Добавлено unallocatedItems как параметр
  const [draggedItem, setDraggedItem] = useState<GroupedRepairItem | null>(null);
  const [draggedFromPositionId, setDraggedFromPositionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((item: GroupedRepairItem, fromPositionId?: string) => {
    setDraggedItem(item);
    setDraggedFromPositionId(fromPositionId || null);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDraggedFromPositionId(null);
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((
    targetPositionId: string,
    positions: Position[],
    // unallocatedItems: RepairItem[], // Удалено, так как теперь это параметр хука
    setPositions: (positions: Position[]) => void,
    setUnallocatedItems: (items: RepairItem[]) => void
  ) => {
    if (!draggedItem) return;

    console.log('handleDrop called:', {
      targetPositionId,
      draggedItem: draggedItem.id,
      draggedFromPositionId,
      groupedIds: draggedItem.groupedIds
    });

    let itemsToMove: RepairItem[] = [];
    let idsToRemoveFromSource: string[] = []; // Инициализируем пустым массивом

    if (draggedFromPositionId) {
      // --- Перетаскивание из существующей позиции ---
      const sourcePosition = positions.find(p => p.id === draggedFromPositionId);
      if (sourcePosition) {
        itemsToMove = sourcePosition.items.filter(item => 
          draggedItem.groupedIds.includes(item.id)
        );
        idsToRemoveFromSource = draggedItem.groupedIds; // Удаляем всю группу
        console.log('Items to move from position:', itemsToMove.length);
      }
    } else {
      // --- Перетаскивание из неразмещенных ---
      // При перетаскивании из неразмещенных, всегда перемещаем всю группу,
      // как она была сгруппирована в UnallocatedItemsPanel.
      itemsToMove = ungroupItems(draggedItem, unallocatedItems);
      idsToRemoveFromSource = itemsToMove.map(i => i.id); // ID для удаления - это ID перемещаемых элементов.
      console.log(`Moving entire grouped item (${itemsToMove.length} items) from unallocated.`);
    }

    if (itemsToMove.length === 0) {
      console.warn('No items to move found');
      handleDragEnd();
      return;
    }

    // Обновляем состояние позиций
    const newPositions = positions.map(position => {
      // Удаляем из исходной позиции (если применимо)
      if (position.id === draggedFromPositionId) {
        const remainingItems = position.items.filter(item => 
          !idsToRemoveFromSource.includes(item.id)
        );
        const sourceTotals = recalculatePositionTotals(remainingItems);
        return { ...position, items: remainingItems, ...sourceTotals };
      } 
      // Добавляем в целевую позицию
      else if (position.id === targetPositionId) {
        const newItems = [...position.items, ...itemsToMove];
        const targetTotals = recalculatePositionTotals(newItems);
        return { ...position, items: newItems, ...targetTotals };
      }
      return position;
    });

    // Обновляем состояние неразмещенных элементов
    let newUnallocatedItems = unallocatedItems;
    if (!draggedFromPositionId) {
      // Проверяем логику "копирования"
      const lowerCaseSalaryGoods = draggedItem.salaryGoods.toLowerCase();
      const isCopyItem = lowerCaseSalaryGoods.includes('зарплата') || lowerCaseSalaryGoods.includes('провод');

      if (isCopyItem) {
        console.log(`Item from "${draggedItem.salaryGoods}" category is copied, not moved.`);
        // newUnallocatedItems остается без изменений
      } else {
        // Стандартная логика "перемещения": удаляем перемещенные элементы из неразмещенных
        console.log(`Item from "${draggedItem.salaryGoods}" category is moved.`);
        newUnallocatedItems = unallocatedItems.filter(item => 
          !idsToRemoveFromSource.includes(item.id)
        );
      }
    }

    console.log('Updating state:', {
      newPositionsCount: newPositions.length,
      newUnallocatedCount: newUnallocatedItems.length,
      targetPosition: newPositions.find(p => p.id === targetPositionId)
    });

    setPositions(newPositions);
    setUnallocatedItems(newUnallocatedItems);
    handleDragEnd();
  }, [draggedItem, draggedFromPositionId, handleDragEnd, unallocatedItems]); // unallocatedItems теперь в зависимостях хука

  const handleDropToUnallocated = useCallback((
    positions: Position[],
    // unallocatedItems: RepairItem[], // Удалено, так как теперь это параметр хука
    setPositions: (positions: Position[]) => void,
    setUnallocatedItems: (items: RepairItem[]) => void
  ) => {
    if (!draggedItem || !draggedFromPositionId) return;

    console.log('handleDropToUnallocated called:', {
      draggedItem: draggedItem.id,
      draggedFromPositionId,
      groupedIds: draggedItem.groupedIds
    });

    // Получаем исходные элементы для перемещения
    let itemsToMove: RepairItem[] = [];
    
    const sourcePosition = positions.find(p => p.id === draggedFromPositionId);
    if (sourcePosition) {
      // Находим все исходные элементы по их ID
      itemsToMove = sourcePosition.items.filter(item => 
        draggedItem.groupedIds.includes(item.id)
      );
      
      console.log('Items to move to unallocated:', itemsToMove.length);
    }

    if (itemsToMove.length === 0) {
      console.warn('No items to move found');
      handleDragEnd();
      return;
    }

    // ВАЖНО: Создаем новые объекты вместо мутации существующих
    const newPositions = positions.map(position => {
      if (position.id === draggedFromPositionId) {
        // Исходная позиция - удаляем элементы
        const remainingItems = position.items.filter(item => 
          !draggedItem.groupedIds.includes(item.id)
        );
        const totals = recalculatePositionTotals(remainingItems);
        
        return {
          ...position, // Создаем новый объект
          items: remainingItems,
          ...totals
        };
      }
      return position; // Остальные позиции остаются без изменений
    });

    // Добавляем элементы в неразмещенные
    const newUnallocatedItems = [...unallocatedItems, ...itemsToMove];

    console.log('Updating state for unallocated drop:', {
      newPositionsCount: newPositions.length,
      newUnallocatedCount: newUnallocatedItems.length
    });

    // Обновляем состояние
    setPositions(newPositions);
    setUnallocatedItems(newUnallocatedItems);
    handleDragEnd();
  }, [draggedItem, draggedFromPositionId, handleDragEnd, unallocatedItems]); // unallocatedItems теперь в зависимостях хука

  return {
    draggedItem,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDropToUnallocated
  };
};
