import React, { useState } from 'react';
import { HotkeyAction, HotkeyMap } from '../hooks/useHotkeys';
import { formatKeyEvent } from '../utils/hotkeyUtils';
import { X, Keyboard } from 'lucide-react';

interface HotkeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotkeys: HotkeyMap;
  onUpdateHotkey: (action: HotkeyAction, key: string) => void;
}

const HotkeyInput: React.FC<{
  value: string;
  onSet: (key: string) => void;
}> = ({ value, onSet }) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const formattedKey = formatKeyEvent(e);
    if (formattedKey) {
      onSet(formattedKey);
    }
    setIsRecording(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-48 text-center px-3 py-2 border rounded-lg cursor-pointer transition-all ${
          isRecording 
            ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
        onClick={() => setIsRecording(true)}
        onKeyDown={isRecording ? handleKeyDown : undefined}
        onBlur={() => setIsRecording(false)}
        tabIndex={0}
      >
        {isRecording ? 'Нажмите клавиши...' : value}
      </div>
      {isRecording && (
        <button onClick={() => setIsRecording(false)} className="text-sm text-gray-600 hover:text-gray-800">
          Отмена
        </button>
      )}
    </div>
  );
};

export const HotkeySettingsModal: React.FC<HotkeySettingsModalProps> = ({
  isOpen,
  onClose,
  hotkeys,
  onUpdateHotkey,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[450px] max-w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-gray-700" />
            <span>Настройка горячих клавиш</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Свернуть/развернуть 1-й уровень (Категории)
            </label>
            <HotkeyInput
              value={hotkeys.toggleLevel1}
              onSet={(key) => onUpdateHotkey('toggleLevel1', key)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Свернуть/развернуть 2-й уровень (Статьи работ)
            </label>
            <HotkeyInput
              value={hotkeys.toggleLevel2}
              onSet={(key) => onUpdateHotkey('toggleLevel2', key)}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
