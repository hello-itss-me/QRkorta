import { RepairItem } from '../types';

export const recalculatePositionTotals = (items: RepairItem[]) => {
  const totalPrice = items.reduce((sum, item) => sum + item.revenue, 0);
  const totalIncome = items
    .filter(item => item.incomeExpenseType === 'Доходы')
    .reduce((sum, item) => sum + item.revenue, 0);
  const totalExpense = items
    .filter(item => item.incomeExpenseType === 'Расходы')
    .reduce((sum, item) => sum + Math.abs(item.revenue), 0);
  
  return { totalPrice, totalIncome, totalExpense };
};
