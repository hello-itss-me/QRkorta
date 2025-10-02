import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface NewItemFormProps {
  workType: string;
  onSave: (data: { name: string; price: number; type: 'Доходы' | 'Расходы'; quantity: number; description: string }) => void;
  onCancel: () => void;
}

export const NewItemForm: React.FC<NewItemFormProps> = ({ workType, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Доходы' | 'Расходы'>('Доходы');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = parseFloat(price);
    const quantityValue = parseInt(quantity, 10);
    if (name.trim() && !isNaN(priceValue) && priceValue >= 0 && !isNaN(quantityValue) && quantityValue > 0) {
      onSave({ name: name.trim(), price: priceValue, type, quantity: quantityValue, description: description.trim() });
    } else {
      alert('Пожалуйста, введите корректное название, цену и количество (больше 0).');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Новая позиция в группе "{workType}"</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                Название услуги/материала
              </label>
              <input
                type="text"
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например, Замена масла"
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Цена за ед. (в рублях)
                </label>
                <input
                  type="number"
                  id="itemPrice"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Например, 5000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Количество
                </label>
                <input
                  type="number"
                  id="itemQuantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Описание (необязательно)
              </label>
              <textarea
                id="itemDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Дополнительная информация..."
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Тип операции</span>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="Доходы"
                    checked={type === 'Доходы'}
                    onChange={() => setType('Доходы')}
                    className="form-radio h-4 w-4 text-green-600"
                  />
                  <span className="ml-2 text-green-700">Доход</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="Расходы"
                    checked={type === 'Расходы'}
                    onChange={() => setType('Расходы')}
                    className="form-radio h-4 w-4 text-red-600"
                  />
                  <span className="ml-2 text-red-700">Расход</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
