"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useBodyScrollLock(isOpen);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fade-in p-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-2xl w-full max-w-sm animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-3">
          <h3 className="text-[17px] font-semibold text-primary dark:text-white">{title}</h3>
          <p className="text-[15px] text-[#8E8E93]">{message}</p>
        </div>
        <div className="border-t border-[#C6C6C8]/30 dark:border-gray-700/50">
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-[#007AFF] font-semibold border-b border-[#C6C6C8]/30 dark:border-gray-700/50 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3.5 text-[17px] text-red-500 font-medium min-h-[44px]"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
