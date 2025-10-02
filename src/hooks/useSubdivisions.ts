import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Subdivision {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
  user_id: string;
}

export const useSubdivisions = () => {
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubdivisions();
  }, []);

  const fetchSubdivisions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subdivisions')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSubdivisions(data || []);
    } catch (error) {
      console.error('Error fetching subdivisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSubdivision = async (name: string, code?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subdivisions')
        .insert([{ name, code: code || null, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSubdivisions(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
      }
      return data;
    } catch (error) {
      console.error('Error adding subdivision:', error);
      throw error;
    }
  };

  return { subdivisions, isLoading, addSubdivision, refreshSubdivisions: fetchSubdivisions };
};
