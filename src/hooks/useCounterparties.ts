import { useState, useEffect, useCallback } from 'react';
import { Counterparty } from '../types';
import { supabase } from '../utils/supabaseClient';

export const useCounterparties = () => {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounterparties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('counterparties')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setCounterparties(data || []);
    } catch (err) {
      console.error('Error fetching counterparties:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки контрагентов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounterparties();
  }, [fetchCounterparties]);

  return {
    counterparties,
    loading,
    error,
    fetchCounterparties,
  };
};
