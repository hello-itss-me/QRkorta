import { useState, useEffect } from 'react';
import { UpdDocument } from '../types';
import { supabase } from '../utils/supabaseClient';

export const useUpdDocuments = (
  startDate: Date | null,
  endDate: Date | null,
  counterpartyName: string | null // Добавляем новый параметр
) => {
  const [updDocuments, setUpdDocuments] = useState<UpdDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('upd_documents')
        .select('*')
        .eq('is_active', true);

      if (startDate) {
        query = query.gte('document_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('document_date', endDate.toISOString());
      }
      
      // Добавляем фильтрацию по имени контрагента, если оно предоставлено
      if (counterpartyName) {
        query = query.eq('counterparty_name', counterpartyName);
      }

      query = query.order('document_date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setUpdDocuments(data || []);
    } catch (err) {
      console.error('Error fetching UPD documents:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки документов УПД');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdDocuments();
  }, [startDate, endDate, counterpartyName]); // Перезапускаем fetch при изменении имени контрагента

  return {
    updDocuments,
    loading,
    error,
    fetchUpdDocuments,
  };
};
