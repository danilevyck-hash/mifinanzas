"use client";

import { useEffect, useRef } from "react";

type Props = {
  show: boolean;
  onComplete?: () => void;
};

const COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6"];
const PARTICLE_COUNT = 50;
const DURATION = 2500;

export default function Confetti({ show, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onComplete?.();
    }, DURATION);

    return () => clearTimeout(timer);
  }, [show, onComplete]);

  if (!show) return null;

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = 1.8 + Math.random() * 1.2;
    const size = 6 + Math.random() * 6;
    const color = COLORS[i % COLORS.length];
    const rotation = Math.random() * 360;
    const drift = (Math.random() - 0.5) * 120;
    const isCircle = Math.random() > 0.5;

    return (
      <span
        key={i}
        className="absolute block animate-confetti-fall"
        style={{
          left: `${left}%`,
          top: "-10px",
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          borderRadius: isCircle ? "50%" : "2px",
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          // @ts-expect-error CSS custom properties
          "--drift": `${drift}px`,
          "--rotation": `${rotation}deg`,
        }}
      />
    );
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 pointer-events-auto cursor-pointer overflow-hidden"
      onClick={() => onComplete?.()}
    >
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rotation));
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
      `}</style>
      {particles}
    </div>
  );
}
