export function predictMonthEnd(totalSpent: number, daysPassed: number, daysInMonth: number): number {
  if (daysPassed === 0) return 0;
  const dailyRate = totalSpent / daysPassed;
  return dailyRate * daysInMonth;
}
