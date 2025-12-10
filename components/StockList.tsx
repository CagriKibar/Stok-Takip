import React from 'react';
import { StockItem } from '../types';
import { Trash2, Plus, Minus, FileSpreadsheet, PackageOpen } from 'lucide-react';

interface StockListProps {
  items: StockItem[];
  onIncrement: (barcode: string) => void;
  onDecrement: (barcode: string) => void;
  onDelete: (barcode: string) => void;
  onExport: () => void;
  onClearAll: () => void;
}

const StockList: React.FC<StockListProps> = ({ 
  items, 
  onIncrement, 
  onDecrement, 
  onDelete
}) => {
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-20">
        <PackageOpen size={64} className="mb-4 opacity-20" />
        <p className="font-semibold text-lg">Liste Boş</p>
        <p className="text-sm">"Tara" ekranından ürün ekleyin.</p>
      </div>
    );
  }

  // Sort by latest scanned first
  const sortedItems = [...items].sort((a, b) => b.lastScannedAt - a.lastScannedAt);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-24 space-y-3">
        {sortedItems.map((item) => (
          <div key={item.barcode} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex-1 overflow-hidden pr-2">
              <div className="font-mono text-sm font-bold text-gray-800 truncate select-all">
                {item.barcode}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Son: {new Date(item.lastScannedAt).toLocaleTimeString('tr-TR')}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button 
                  onClick={() => onDecrement(item.barcode)}
                  className="p-3 hover:bg-gray-200 rounded-md text-gray-600 active:bg-gray-300 touch-manipulation"
                >
                  <Minus size={18} />
                </button>
                <span className="min-w-[40px] text-center font-bold text-xl text-blue-600">
                  {item.quantity}
                </span>
                <button 
                  onClick={() => onIncrement(item.barcode)}
                  className="p-3 hover:bg-gray-200 rounded-md text-gray-600 active:bg-gray-300 touch-manipulation"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <button 
                onClick={() => onDelete(item.barcode)}
                className="p-3 text-gray-300 hover:text-red-500 transition-colors active:text-red-600"
                title="Sil"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        
        <div className="text-center text-xs text-gray-400 py-4">
            Listenin sonu.
        </div>
      </div>
    </div>
  );
};

export default StockList;