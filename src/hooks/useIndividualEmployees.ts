import { useState, useEffect } from 'react';
import { IndividualEmployee } from '../types';
import { supabase } from '../utils/supabaseClient';

export const useIndividualEmployees = () => {
  const [individualEmployees, setIndividualEmployees] = useState<IndividualEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndividualEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('individual_employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (fetchError) {
        throw fetchError;
      }

      setIndividualEmployees(data || []);
    } catch (err) {
      console.error('Error fetching individual employees:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const addIndividualEmployee = async (employee: Omit<IndividualEmployee, 'id' | 'created_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('individual_employees')
        .insert([employee])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setIndividualEmployees(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding individual employee:', err);
      throw err;
    }
  };

  const updateIndividualEmployee = async (id: string, updates: Partial<IndividualEmployee>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('individual_employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setIndividualEmployees(prev => prev.map(emp => emp.id === id ? data : emp));
      return data;
    } catch (err) {
      console.error('Error updating individual employee:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchIndividualEmployees();
  }, []);

  return {
    individualEmployees,
    loading,
    error,
    fetchIndividualEmployees,
    addIndividualEmployee,
    updateIndividualEmployee
  };
};
