export function formatCurrency(amount: number): string {
  let symbol = "$";
  if (typeof window !== "undefined") {
    try {
      const prefs = JSON.parse(localStorage.getItem("mifinanzas_prefs") || "{}");
      const symbolMap: Record<string, string> = { USD: "$", PAB: "B/.", COP: "$", MXN: "$", EUR: "\u20AC" };
      if (prefs.currency && symbolMap[prefs.currency]) symbol = symbolMap[prefs.currency];
    } catch {}
  }
  return symbol + amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Returns YYYY-MM-DD in the user's local timezone (not UTC).
// Using new Date().toISOString() shifts the date by 1 day for users west of UTC
// (Panama UTC-5: at 7pm local on Apr 4, toISOString returns Apr 5).
export function todayLocalISO(): string {
  return localISO(new Date());
}

export function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr + "T12:00:00");
  const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const [, month, day] = dateStr.split("-");
  let format = "DD/MM";
  if (typeof window !== "undefined") {
    try {
      const prefs = JSON.parse(localStorage.getItem("mifinanzas_prefs") || "{}");
      if (prefs.dateFormat) format = prefs.dateFormat;
    } catch {}
  }
  if (format === "MM/DD") return `${days[date.getDay()]} ${month}/${day}`;
  return `${days[date.getDay()]} ${day}/${month}`;
}

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTH_ABBR_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatDateExport(dateStr: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  const monthIdx = parseInt(month, 10) - 1;
  return `${day}-${MONTH_ABBR_ES[monthIdx]}-${year}`;
}
