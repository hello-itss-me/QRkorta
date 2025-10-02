import { useState, useEffect } from 'react';
import { Bearing } from '../types';
import { supabase } from '../utils/supabaseClient';

export const useBearings = () => {
  const [bearings, setBearings] = useState<Bearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBearings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bearings')
        .select('*')
        .eq('is_active', true)
        .order('inner_diameter')
        .order('designation');

      if (fetchError) {
        throw fetchError;
      }

      setBearings(data || []);
    } catch (err) {
      console.error('Error fetching bearings:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки подшипников');
    } finally {
      setLoading(false);
    }
  };

  const addBearing = async (bearing: Omit<Bearing, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('bearings')
        .insert([bearing])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setBearings(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding bearing:', err);
      throw err;
    }
  };

  const updateBearing = async (id: string, updates: Partial<Bearing>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('bearings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setBearings(prev => prev.map(bearing => bearing.id === id ? data : bearing));
      return data;
    } catch (err) {
      console.error('Error updating bearing:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBearings();
  }, []);

  return {
    bearings,
    loading,
    error,
    fetchBearings,
    addBearing,
    updateBearing
  };
};
