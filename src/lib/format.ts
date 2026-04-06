export function formatCurrency(amount: number, symbol: string = "$"): string {
  return symbol + amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string, format: string = "DD/MM"): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr + "T12:00:00");
  const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const [, month, day] = dateStr.split("-");
  if (format === "MM/DD") {
    return `${days[date.getDay()]} ${month}/${day}`;
  }
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
