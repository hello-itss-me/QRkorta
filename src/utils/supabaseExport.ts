import { supabase } from './supabaseClient';
import { SavedPosition, SavedPositionItem, RepairItem, Template, TemplateItem, UpdDocument, Position } from '../types';

export const getSavedPositions = async (): Promise<SavedPosition[]> => {
  const { data, error } = await supabase
    .from('saved_positions')
    .select('*')
    .order('export_date', { ascending: false });

  if (error) {
    console.error('Error fetching saved positions:', error);
    throw error;
  }
  return data || [];
};

export const getSavedPositionById = async (id: string): Promise<SavedPosition | null> => {
  const { data, error } = await supabase
    .from('saved_positions')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching saved position by ID:', error);
    throw error;
  }
  return data;
};

export const getSavedPositionItems = async (positionId: string): Promise<SavedPositionItem[]> => {
  const { data, error } = await supabase
    .from('saved_position_items')
    .select('*')
    .eq('position_id', positionId);

  if (error) {
    console.error('Error fetching saved position items:', error);
    throw error;
  }
  return data || [];
};

export const deleteSavedPosition = async (positionId: string): Promise<boolean> => {
  // First, delete associated items
  const { error: deleteItemsError } = await supabase
    .from('saved_position_items')
    .delete()
    .eq('position_id', positionId);

  if (deleteItemsError) {
    console.error('Error deleting saved position items:', deleteItemsError);
    throw deleteItemsError;
  }

  // Then, delete the position itself
  const { error: deletePositionError } = await supabase
    .from('saved_positions')
    .delete()
    .eq('id', positionId);

  if (deletePositionError) {
    console.error('Error deleting saved position:', deletePositionError);
    throw deletePositionError;
  }

  return true;
};

export const getTemplates = async (): Promise<Template[]> => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
  return data || [];
};

export const getTemplateItems = async (templateId: string): Promise<TemplateItem[]> => {
  const { data, error } = await supabase
    .from('template_items')
    .select('*')
    .eq('template_id', templateId);

  if (error) {
    console.error('Error fetching template items:', error);
    throw error;
  }
  return data || [];
};

export const deleteTemplate = async (templateId: string): Promise<boolean> => {
  // First, delete associated items
  const { error: deleteItemsError } = await supabase
    .from('template_items')
    .delete()
    .eq('template_id', templateId);

  if (deleteItemsError) {
    console.error('Error deleting template items:', deleteItemsError);
    throw deleteItemsError;
  }

  // Then, delete the template itself
  const { error: deleteTemplateError } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId);

  if (deleteTemplateError) {
    console.error('Error deleting template:', deleteTemplateError);
    throw deleteTemplateError;
  }

  return true;
};

export const getUpdDocuments = async (counterpartyName?: string): Promise<UpdDocument[]> => {
  let query = supabase
    .from('upd_documents')
    .select('*')
    .eq('is_active', true)
    .order('document_name', { ascending: true });

  if (counterpartyName) {
    query = query.eq('counterparty_name', counterpartyName);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching UPD documents:', error);
    throw error;
  }
  return data || [];
};

export const savePositionsAsTemplate = async (
  positions: Position[],
  templateName: string,
  templateDescription: string | null
): Promise<{ success: boolean; message: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Пользователь не авторизован.' };
  }

  try {
    // 1. Insert into templates table
    const { data: newTemplate, error: templateError } = await supabase
      .from('templates')
      .insert({
        name: templateName,
        description: templateDescription,
        user_id: user.id,
      })
      .select()
      .single();

    if (templateError) {
      if (templateError.code === '23505') { // Unique violation
        return { success: false, message: `Шаблон с названием "${templateName}" уже существует.` };
      }
      console.error('Error saving template:', templateError);
      throw templateError;
    }

    if (!newTemplate) {
      return { success: false, message: 'Не удалось создать шаблон.' };
    }

    // 2. Prepare template items for insertion
    const templateItemsToInsert = positions.map(pos => ({
      template_id: newTemplate.id,
      position_number: pos.positionNumber,
      service: pos.service,
      items_data: pos.items, // Store the array of RepairItem
      total_price: pos.totalPrice,
      total_income: pos.totalIncome,
      total_expense: pos.totalExpense,
    }));

    const { error: itemsError } = await supabase
      .from('template_items')
      .insert(templateItemsToInsert);

    if (itemsError) {
      console.error('Error saving template items:', itemsError);
      throw itemsError;
    }

    return { success: true, message: `Шаблон "${templateName}" успешно сохранен!` };
  } catch (err) {
    console.error('Unexpected error in savePositionsAsTemplate:', err);
    return { success: false, message: 'Произошла непредвиденная ошибка при сохранении шаблона.' };
  }
};
