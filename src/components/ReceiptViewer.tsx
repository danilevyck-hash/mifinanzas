"use client";

import { useState, useRef } from "react";

type Props = {
  url: string;
  onClose: () => void;
};

export default function ReceiptViewer({ url, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const lastDistance = useRef<number | null>(null);

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length < 2) return;
    const dist = getDistance(e.touches);
    if (dist && lastDistance.current) {
      const delta = dist / lastDistance.current;
      setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
    }
    lastDistance.current = dist;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDistance.current = getDistance(e.touches);
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        className="max-w-full max-h-full overflow-hidden flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Recibo"
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-100"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-6 flex gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(s + 0.5, 5)); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-lg font-bold transition-colors"
        >
          +
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(1); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors"
        >
          1:1
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(s - 0.5, 0.5)); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-lg font-bold transition-colors"
        >
          -
        </button>
      </div>
    </div>
  );
}
