"use client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-3">
          <h3 className="text-[17px] font-semibold text-primary dark:text-white">{title}</h3>
          <p className="text-[15px] text-[#8E8E93]">{message}</p>
        </div>
        <div className="border-t border-[#C6C6C8]/30 dark:border-gray-700/50">
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-[#007AFF] font-semibold border-b border-[#C6C6C8]/30 dark:border-gray-700/50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3.5 text-[17px] text-red-500 font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
