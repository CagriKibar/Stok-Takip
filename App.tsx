import React, { useState, useEffect, useCallback } from 'react';
import { StockItem, AppMode, ToastMessage } from './types';
import BarcodeScanner from './components/BarcodeScanner';
import StockList from './components/StockList';
import { exportToExcel } from './services/excelService';
import { Scan, List, Download, Save, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.SCAN);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastSaved, setLastSaved] = useState<string>("");
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('stock_items');
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("Failed to parse saved items", e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('stock_items', JSON.stringify(items));
    const now = new Date();
    setLastSaved(now.toLocaleTimeString('tr-TR'));
  }, [items]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  };

  const handleScan = useCallback((barcode: string) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.barcode === barcode);
      
      if (existingItemIndex >= 0) {
        // Increment existing
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1,
          lastScannedAt: Date.now()
        };
        addToast(`${barcode}: Adet Artırıldı (${newItems[existingItemIndex].quantity})`, 'success');
        return newItems;
      } else {
        // Add new
        addToast(`${barcode}: Listeye Eklendi`, 'success');
        return [{
          barcode,
          quantity: 1,
          lastScannedAt: Date.now()
        }, ...prevItems];
      }
    });
  }, []);

  const handleIncrement = (barcode: string) => {
    setItems(prev => prev.map(item => 
      item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const handleDecrement = (barcode: string) => {
    setItems(prev => prev.map(item => {
        if (item.barcode !== barcode) return item;
        return { ...item, quantity: Math.max(0, item.quantity - 1) };
    }));
  };

  const handleDelete = (barcode: string) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      setItems(prev => prev.filter(item => item.barcode !== barcode));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm listeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        setItems([]);
        localStorage.removeItem('stock_items');
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="bg-blue-600 text-white p-3 shadow-md z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
            <div>
                <h1 className="text-lg font-bold tracking-tight">Stok Takip</h1>
                {lastSaved && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-100 opacity-90">
                        <Save size={10} />
                        <span>Otomatik Kayıt: {lastSaved}</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                {items.length > 0 && (
                    <button 
                        onClick={() => exportToExcel(items)}
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded shadow transition-colors"
                    >
                        <Download size={16} />
                        Excel
                    </button>
                )}
                {items.length > 0 && mode === AppMode.LIST && (
                     <button 
                        onClick={handleClearAll}
                        className="bg-red-500 hover:bg-red-600 p-2 rounded text-white shadow"
                     >
                        <Trash2 size={16} />
                     </button>
                )}
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 max-w-4xl mx-auto w-full relative">
        {mode === AppMode.SCAN && (
          <div className="flex flex-col h-full gap-4 animate-fadeIn">
            <div className="flex-none">
                <BarcodeScanner onScan={handleScan} />
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-end mb-2 px-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Son İşlemler</h3>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Toplam: {totalItems} Adet
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-inner border border-gray-200 p-0">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                             <Scan size={32} className="opacity-20" />
                             <p className="text-sm">Barkod okutmaya başlayın.</p>
                        </div>
                    ) : (
                        items.slice(0, 20).map((item, index) => (
                            <div key={item.barcode} className={`flex justify-between items-center p-3 border-b border-gray-100 last:border-0 ${index === 0 ? 'bg-blue-50/50' : ''}`}>
                                <div>
                                    <div className="font-mono text-sm font-bold text-gray-800">{item.barcode}</div>
                                    <div className="text-[10px] text-gray-400">{new Date(item.lastScannedAt).toLocaleTimeString('tr-TR')}</div>
                                </div>
                                <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-lg">
                                    {item.quantity}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        )}

        {mode === AppMode.LIST && (
          <div className="h-full animate-fadeIn">
            <StockList 
              items={items} 
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onDelete={handleDelete}
              onExport={() => exportToExcel(items)}
              onClearAll={handleClearAll}
            />
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-xs pointer-events-none px-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm text-center
              transition-all duration-300 animate-slideIn
              ${toast.type === 'success' ? 'border-l-4 border-green-500' : ''}
              ${toast.type === 'error' ? 'border-l-4 border-red-500' : ''}
            `}
          >
            {toast.text}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
          <button 
            onClick={() => setMode(AppMode.SCAN)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${mode === AppMode.SCAN ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Scan size={24} className={mode === AppMode.SCAN ? 'fill-blue-100' : ''} />
            <span className="text-xs font-medium mt-1">Tara</span>
          </button>
          
          <div className="w-px h-8 bg-gray-200"></div>

          <button 
            onClick={() => setMode(AppMode.LIST)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${mode === AppMode.LIST ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="relative">
                <List size={24} className={mode === AppMode.LIST ? 'fill-blue-100' : ''} />
                {items.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                        {items.length}
                    </span>
                )}
            </div>
            <span className="text-xs font-medium mt-1">Liste</span>
          </button>
        </div>
      </nav>
      
      <style>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default App;