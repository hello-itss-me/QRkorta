import { useState, useEffect } from 'react';
import { Motor } from '../types';
import { supabase } from '../utils/supabaseClient';
import { importMotorsFromExcel } from '../utils/importMotorsFromExcel'; // Импортируем новую утилиту

export const useMotors = () => {
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMotors = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('motors')
        .select('*')
        .eq('is_active', true)
        .order('power_kw')
        .order('rpm');

      if (fetchError) {
        throw fetchError;
      }

      setMotors(data || []);
    } catch (err) {
      console.error('Error fetching motors:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки двигателей');
    } finally {
      setLoading(false);
    }
  };

  const addMotor = async (motor: Omit<Motor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('motors')
        .insert([motor])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setMotors(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding motor:', err);
      throw err;
    }
  };

  const updateMotor = async (id: string, updates: Partial<Motor>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('motors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setMotors(prev => prev.map(motor => motor.id === id ? data : motor));
      return data;
    } catch (err) {
      console.error('Error updating motor:', err);
      throw err;
    }
  };

  const importMotors = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const importedData = await importMotorsFromExcel(file);
      const newMotors: Omit<Motor, 'id' | 'created_at' | 'updated_at' | 'is_active'>[] = [];
      const updatedMotors: Motor[] = [];

      for (const motorData of importedData) {
        // Поиск существующего двигателя по имени, мощности и оборотам
        const existingMotor = motors.find(m =>
          m.name === motorData.name &&
          m.power_kw === motorData.power_kw &&
          m.rpm === motorData.rpm
        );

        if (existingMotor) {
          // Обновляем существующий двигатель
          const { data, error: updateError } = await supabase
            .from('motors')
            .update({
              ...motorData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingMotor.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Error updating motor ${existingMotor.name}:`, updateError);
            // Можно пропустить или добавить в список ошибок
          } else if (data) {
            updatedMotors.push(data);
          }
        } else {
          // Добавляем новый двигатель
          newMotors.push({ ...motorData, is_active: true });
        }
      }

      if (newMotors.length > 0) {
        const { data, error: insertError } = await supabase
          .from('motors')
          .insert(newMotors)
          .select();

        if (insertError) {
          console.error('Error inserting new motors:', insertError);
          throw insertError;
        }
        if (data) {
          setMotors(prev => [...prev, ...data]);
        }
      }

      // Обновляем состояние для измененных двигателей
      if (updatedMotors.length > 0) {
        setMotors(prev => prev.map(motor => {
          const updated = updatedMotors.find(um => um.id === motor.id);
          return updated || motor;
        }));
      }

      await fetchMotors(); // Перезагружаем все двигатели, чтобы убедиться в актуальности
      return { newCount: newMotors.length, updatedCount: updatedMotors.length };
    } catch (err) {
      console.error('Error importing motors:', err);
      setError(err instanceof Error ? err.message : 'Ошибка импорта двигателей из Excel');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotors();
  }, []);

  return {
    motors,
    loading,
    error,
    fetchMotors,
    addMotor,
    updateMotor,
    importMotors,
  };
};
