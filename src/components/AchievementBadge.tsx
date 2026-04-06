"use client";

import { ACHIEVEMENT_TYPES } from "@/lib/achievements";

type Props = {
  type: string;
  name: string;
  earnedAt: string;
};

export default function AchievementBadge({ type, name, earnedAt }: Props) {
  const achievementInfo = ACHIEVEMENT_TYPES[type];
  const emoji = achievementInfo?.emoji || "🏅";
  const displayName = achievementInfo?.name || name;
  const description = achievementInfo?.description || "";

  return (
    <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700">
      <span className="text-xl">{emoji}</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-primary dark:text-white">{displayName}</span>
        {description && (
          <span className="text-[10px] text-muted dark:text-gray-400">{description}</span>
        )}
        <span className="text-[10px] text-muted dark:text-gray-500">
          {new Date(earnedAt).toLocaleDateString("es-PA")}
        </span>
      </div>
    </div>
  );
}
