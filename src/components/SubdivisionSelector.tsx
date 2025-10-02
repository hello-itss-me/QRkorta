import React, { useState } from 'react';
import { X, Search, Plus, Building2 } from 'lucide-react';
import { useSubdivisions, Subdivision } from '../hooks/useSubdivisions';

interface SubdivisionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (subdivision: Subdivision | null) => void;
  currentSubdivisionId?: string | null;
}

export const SubdivisionSelector: React.FC<SubdivisionSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSubdivisionId
}) => {
  const { subdivisions, isLoading, addSubdivision } = useSubdivisions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  if (!isOpen) return null;

  const filteredSubdivisions = subdivisions.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.code && sub.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (subdivision: Subdivision | null) => {
    onSelect(subdivision);
    onClose();
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;

    try {
      const newSubdivision = await addSubdivision(newName.trim(), newCode.trim() || undefined);
      setNewName('');
      setNewCode('');
      setIsAddingNew(false);
      if (newSubdivision) {
        handleSelect(newSubdivision);
      }
    } catch (error) {
      alert('Ошибка при добавлении подразделения');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Выбрать подразделение</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию или коду..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  currentSubdivisionId === null
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Без подразделения</div>
                    <div className="text-sm text-gray-500">Не указывать подразделение</div>
                  </div>
                </div>
              </button>

              {filteredSubdivisions.map((subdivision) => (
                <button
                  key={subdivision.id}
                  onClick={() => handleSelect(subdivision)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    currentSubdivisionId === subdivision.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{subdivision.name}</div>
                      {subdivision.code && (
                        <div className="text-sm text-gray-500">Код: {subdivision.code}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {filteredSubdivisions.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  Подразделения не найдены
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          {isAddingNew ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Название подразделения"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <input
                type="text"
                placeholder="Код (необязательно)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddNew}
                  disabled={!newName.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Добавить
                </button>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewName('');
                    setNewCode('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Добавить новое подразделение</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
