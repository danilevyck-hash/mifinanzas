"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

type ScanResult = {
  amount: number;
  category: string;
  notes: string;
};

type Props = {
  onCapture: (url: string) => void;
  onScanResult?: (result: ScanResult) => void;
  existingUrl?: string;
  onRemove?: () => void;
  onViewFull?: (url: string) => void;
};

export default function ReceiptCapture({ onCapture, onScanResult, existingUrl, onRemove, onViewFull }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onCapture(data.url);

        // Auto-scan the receipt with Claude Vision
        if (onScanResult) {
          setScanning(true);
          try {
            const scanRes = await authFetch("/api/scan-receipt", {
              method: "POST",
              body: JSON.stringify({ image_url: data.url }),
            });
            if (scanRes.ok) {
              const scanData = await scanRes.json();
              onScanResult(scanData);
            }
          } catch { toast("No se pudo leer el recibo", "error"); }
          finally { setScanning(false); }
        }
      } else {
        setPreview(null);
      }
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const displayUrl = existingUrl || preview;

  return (
    <div>
      <label className="block text-sm font-medium text-primary dark:text-white mb-1">Recibo</label>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {displayUrl ? (
        <div className="flex items-center gap-2 h-[52px]">
          <button
            type="button"
            onClick={() => onViewFull?.(displayUrl)}
            className="h-[48px] w-[48px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayUrl} alt="Recibo" className="h-full w-full object-cover" />
          </button>
          <div className="flex-1 min-w-0">
            {scanning ? (
              <span className="text-xs text-blue-500 font-medium flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Leyendo recibo...
              </span>
            ) : (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Recibo adjunto</span>
            )}
          </div>
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-blue-500 hover:text-blue-600 px-2 py-1 rounded transition-colors min-h-[36px]"
            >
              Cambiar
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  onRemove();
                }}
                className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded transition-colors min-h-[36px]"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-[52px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center gap-2 text-sm text-muted dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-500 transition-colors"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Foto del recibo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
