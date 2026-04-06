export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 space-y-2">
          <div className="h-3 w-20 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded animate-pulse" />
          <div className="h-7 w-28 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded animate-pulse" />
          <div className="h-3 w-32 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 space-y-4">
      <div className="h-5 w-32 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded animate-pulse" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded animate-pulse" />
            <div className="h-4 w-16 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded animate-pulse" />
          </div>
          <div className="w-full bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full h-2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
