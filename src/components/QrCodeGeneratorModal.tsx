import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Изменено: импорт QRCodeCanvas как именованный экспорт
import { X, Printer, Copy, Check } from 'lucide-react';
import { SavedPosition } from '../types';

interface QrCodeGeneratorModalProps {
  position: SavedPosition;
  onClose: () => void;
  baseUrl: string; // Base URL of the application, e.g., 'http://localhost:5173'
}

const QrCodeGeneratorModal: React.FC<QrCodeGeneratorModalProps> = ({ position, onClose, baseUrl }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Construct the URL that the QR code will point to
    // This URL will open the QrCodeDetailsViewer for the specific position
    const url = `${baseUrl}/qr-view/${position.id}`;
    setQrUrl(url);
  }, [position, baseUrl]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR-код для позиции ${position.position_number}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin-bottom: 20px; }
              .qr-container img { border: 1px solid #ccc; padding: 10px; }
              .info { margin-top: 10px; font-size: 14px; }
              .info strong { display: block; margin-top: 5px; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>QR-код для позиции №${position.position_number}</h1>
            <div class="qr-container">
              <img src="${(document.getElementById('qr-code-canvas') as HTMLCanvasElement)?.toDataURL()}" alt="QR Code" />
            </div>
            <div class="info">
              <p><strong>Услуга:</strong> ${position.service}</p>
              <p><strong>Контрагент:</strong> ${position.counterparty_name || 'Не указан'}</p>
              <p><strong>Документ УПД:</strong> ${position.document_new || 'Не указан'}</p>
              <p><strong>Статус УПД:</strong> ${position.upd_status || 'Неизвестен'}</p>
              <p><strong>Итоговая сумма:</strong> ${position.total_price.toLocaleString('ru-RU')} ₽</p>
              <p>Отсканируйте этот код, чтобы просмотреть полную информацию о позиции.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      alert('Не удалось скопировать URL.');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-1">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <header className="flex items-center justify-between p-2 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-base font-bold text-gray-800">QR-код для позиции №{position.position_number}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </header>
        <main className="p-4 flex flex-col items-center space-y-4">
          {qrUrl ? (
            <>
              <QRCodeCanvas // Изменено: использование QRCodeCanvas
                id="qr-code-canvas"
                value={qrUrl}
                size={256}
                level="H"
                includeMargin={true}
                className="p-2 bg-white border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-600 text-center">
                Отсканируйте этот QR-код, чтобы просмотреть детали позиции.
              </p>
              <div className="flex space-x-2 w-full justify-center">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  <span>Печать</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center space-x-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Скопировано!' : 'Копировать URL'}</span>
                </button>
              </div>
              <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs break-all">
                {qrUrl}
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-sm text-gray-500">
              {/* Assuming Loader is imported or defined elsewhere, or replace with a simple text loader */}
              {/* <Loader className="w-6 h-6 animate-spin mb-2" /> */}
              <p>Генерация QR-кода...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QrCodeGeneratorModal;
