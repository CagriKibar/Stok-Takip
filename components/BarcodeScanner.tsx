import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, StopCircle, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "html5qr-code-full-region";

  const onScanSuccess = (decodedText: string) => {
    // Play a beep sound
    const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Ignore auto-play errors
    
    onScan(decodedText);
  };

  const startScanning = async () => {
    setError(null);
    
    // Ensure cleanup of previous instance if it exists in a weird state
    if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
    }

    if (!scannerRef.current) {
        try {
            scannerRef.current = new Html5Qrcode(scannerRegionId);
        } catch (e) {
            setError("Tarayıcı başlatılamadı. Sayfayı yenileyin.");
            return;
        }
    }

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
        ] 
    };

    try {
      // First, get cameras to check permissions and availability
      const devices = await Html5Qrcode.getCameras();
      setPermissionGranted(true);

      if (!devices || devices.length === 0) {
        setError("Kamera bulunamadı.");
        return;
      }

      // Strategy 1: Try generic "environment" facing mode (works best on modern mobile browsers)
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          () => {} // ignore frame errors
        );
        setIsScanning(true);
        return; // Success
      } catch (envError) {
        console.warn("Environment facing mode failed, trying fallback...", envError);
      }

      // Strategy 2: If strategy 1 fails, find the back camera manually by label or use the last one
      let cameraId = devices[0].id;
      // Try to find a camera with "back" or "arka" in the label
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('arka') ||
        d.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
          cameraId = backCamera.id;
      } else if (devices.length > 1) {
          // If no label match, usually the last camera is the back one on Android
          cameraId = devices[devices.length - 1].id;
      }

      await scannerRef.current.start(
        cameraId,
        config,
        onScanSuccess,
        () => {}
      );
      setIsScanning(true);

    } catch (err: any) {
      console.error("Scanner critical error:", err);
      let errorMessage = "Kamera başlatılamadı.";
      
      if (err?.name === "NotAllowedError" || err?.message?.includes("permission")) {
        errorMessage = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
      } else if (err?.name === "NotFoundError") {
        errorMessage = "Kamera cihazı bulunamadı.";
      } else if (err?.name === "NotReadableError") {
        errorMessage = "Kamera erişilemiyor. Başka bir uygulama kullanıyor olabilir.";
      } else if (typeof err === 'string') {
         errorMessage = err;
      }
      
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div id={scannerRegionId} className="w-full max-w-sm overflow-hidden rounded-lg bg-gray-100 mb-4 min-h-[300px] flex items-center justify-center relative">
        {!isScanning && !error && (
            <div className="text-gray-400 flex flex-col items-center">
                <Camera size={48} className="mb-2" />
                <span>Kamera Kapalı</span>
            </div>
        )}
        {error && (
            <div className="text-red-500 text-center px-4 flex flex-col items-center gap-2">
                <p className="font-bold">Hata Oluştu</p>
                <p className="text-sm">{error}</p>
                <button 
                    onClick={startScanning}
                    className="mt-2 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-red-200"
                >
                    <RefreshCw size={12} /> Tekrar Dene
                </button>
            </div>
        )}
      </div>

      <div className="flex gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg active:scale-95 transform"
          >
            <Camera size={20} />
            {error ? 'Tekrar Dene' : 'Kamerayı Başlat'}
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg active:scale-95 transform"
          >
            <StopCircle size={20} />
            Durdur
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Barkodu kare alanın içine getirin.
      </p>
    </div>
  );
};

export default BarcodeScanner;