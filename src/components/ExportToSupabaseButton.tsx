import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Position, RepairItem, UpdDocument, Counterparty } from '../types';
import { Save } from 'lucide-react';

interface ExportToSupabaseButtonProps {
  positions: Position[];
  selectedUpdDocument: UpdDocument | null;
  selectedCounterparty: Counterparty | null;
  disabled: boolean;
  onSaveSuccess: () => void;
}

export const ExportToSupabaseButton: React.FC<ExportToSupabaseButtonProps> = ({
  positions,
  selectedUpdDocument,
  selectedCounterparty,
  disabled,
  onSaveSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveToSupabase = async () => {
    setLoading(true);
    setError(null);

    if (!selectedCounterparty) {
      setError('Пожалуйста, выберите контрагента.');
      setLoading(false);
      return;
    }

    if (!selectedUpdDocument || !selectedUpdDocument.document_name) {
      setError('Пожалуйста, выберите или введите документ УПД.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Пользователь не авторизован.');
      setLoading(false);
      return;
    }

    try {
      for (const position of positions) {
        const { totalPrice, totalIncome, totalExpense } = position;

        // 1. Insert into saved_positions
        const { data: newSavedPosition, error: positionError } = await supabase
          .from('saved_positions')
          .insert({
            user_id: user.id,
            position_number: position.positionNumber,
            service: position.service,
            total_price: totalPrice,
            total_income: totalIncome,
            total_expense: totalExpense,
            items_count: position.items.length,
            counterparty_name: selectedCounterparty.name,
            document_new: selectedUpdDocument.document_name,
            upd_status: selectedUpdDocument.status || 'УПД проведены', // Используем статус из выбранного UPD
            subdivision_id: position.subdivisionId || null,
          })
          .select('id') // Select the ID to construct the URL
          .single();

        if (positionError) {
          console.error('Error saving position:', positionError);
          throw new Error(`Ошибка при сохранении позиции: ${positionError.message}`);
        }

        if (!newSavedPosition) {
          throw new Error('Не удалось получить ID сохраненной позиции.');
        }

        // Generate and update the URL for the saved position
        const baseUrl = window.location.origin;
        const qrUrl = `${baseUrl}/qr-view/${newSavedPosition.id}`;

        const { error: urlUpdateError } = await supabase
          .from('saved_positions')
          .update({ url: qrUrl })
          .eq('id', newSavedPosition.id);

        if (urlUpdateError) {
          console.error('Error updating QR URL for position:', urlUpdateError);
          throw new Error(`Ошибка при обновлении URL QR-кода: ${urlUpdateError.message}`);
        }

        // 2. Prepare items for insertion into saved_position_items
        const itemsToInsert = position.items.map((item: RepairItem) => ({
          position_id: newSavedPosition.id,
          item_data: item, // Store the entire item object as JSONB
          position_name: item.positionName, // Добавлено: явно передаем position_name
          income_expense_type: item.type || '', // Добавлено: явно передаем тип дохода/расхода
        }));

        const { error: itemsError } = await supabase
          .from('saved_position_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error saving position items:', itemsError);
          throw new Error(`Ошибка при сохранении элементов позиции: ${itemsError.message}`);
        }
      }

      alert('Все позиции успешно сохранены!');
      onSaveSuccess(); // Clear positions and unallocated items
    } catch (err) {
      console.error('Unexpected error during save:', err);
      setError(err instanceof Error ? err.message : 'Произошла непредвиденная ошибка при сохранении.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSaveToSupabase}
      disabled={disabled || loading || positions.length === 0 || !selectedCounterparty || !selectedUpdDocument}
      className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-medium"
      title="Сохранить все позиции в базу данных"
    >
      {loading ? (
        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Save className="w-3 h-3" />
      )}
      <span>{loading ? 'Сохранение...' : 'Сохранить'}</span>
      {error && <span className="ml-2 text-red-200 text-xs">{error}</span>}
    </button>
  );
};
