import React, { useState } from 'react';
import { Save, Loader, X } from 'lucide-react';
import { Position } from '../types';
import { savePositionsAsTemplate } from '../utils/supabaseExport';

interface SaveTemplateButtonProps {
  positions: Position[];
  disabled?: boolean;
  onSaveSuccess: () => void;
}

export const SaveTemplateButton: React.FC<SaveTemplateButtonProps> = ({
  positions,
  disabled,
  onSaveSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Пожалуйста, введите название шаблона.');
      return;
    }
    if (positions.length === 0) {
      setError('Нет позиций для сохранения в шаблон.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await savePositionsAsTemplate(positions, templateName.trim(), templateDescription.trim() || null);
      if (result.success) {
        alert(result.message);
        setIsOpen(false);
        setTemplateName('');
        setTemplateDescription('');
        onSaveSuccess();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Ошибка при сохранении шаблона:', err);
      setError('Произошла непредвиденная ошибка при сохранении шаблона.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled || positions.length === 0}
        className="flex items-center space-x-1 bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs"
        title="Сохранить текущие позиции как шаблон"
      >
        <Save className="w-3 h-3" />
        <span>Как шаблон</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Сохранить как шаблон</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
                  Название шаблона <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Например: Шаблон ремонта двигателя"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (необязательно)
                </label>
                <textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
                  placeholder="Краткое описание шаблона"
                  disabled={loading}
                ></textarea>
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !templateName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm flex items-center justify-center"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
