import { useState, useEffect } from 'react';
import { JobPosition } from '../types';
import { supabase } from '../utils/supabaseClient';

export const useJobPositions = () => {
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobPositions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('job_positions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setJobPositions(data || []);
    } catch (err) {
      console.error('Error fetching job positions:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки должностей');
    } finally {
      setLoading(false);
    }
  };

  const addJobPosition = async (jobPosition: Omit<JobPosition, 'id' | 'created_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('job_positions')
        .insert([jobPosition])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setJobPositions(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding job position:', err);
      throw err;
    }
  };

  const updateJobPosition = async (id: string, updates: Partial<JobPosition>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('job_positions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setJobPositions(prev => prev.map(pos => pos.id === id ? data : pos));
      return data;
    } catch (err) {
      console.error('Error updating job position:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchJobPositions();
  }, []);

  return {
    jobPositions,
    loading,
    error,
    fetchJobPositions,
    addJobPosition,
    updateJobPosition
  };
};
