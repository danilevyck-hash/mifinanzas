"use client";

import { useEffect } from "react";

type Achievement = {
  emoji: string;
  name: string;
  description: string;
};

type Props = {
  achievement: Achievement | null;
  onDismiss: () => void;
};

export default function AchievementToast({ achievement, onDismiss }: Props) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 px-8 py-6 text-center animate-achievement max-w-xs"
        onClick={onDismiss}
      >
        <div className="text-5xl mb-3">{achievement.emoji}</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {achievement.name}
        </h3>
        <p className="text-sm text-muted dark:text-gray-400">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
