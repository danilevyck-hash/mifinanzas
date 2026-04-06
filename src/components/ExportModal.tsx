"use client";

import { useState, useMemo } from "react";
import { PersonalExpense, Category } from "@/lib/supabase";
import { formatDate, formatDateExport, formatCurrency, MONTH_NAMES } from "@/lib/format";
import { useToast } from "./Toast";

type FilterPreset = "this_month" | "last_month" | "this_year" | "custom";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  expenses: PersonalExpense[];
  categories?: Category[];
};

export default function ExportModal({ isOpen, onClose, expenses }: Props) {
  const { toast } = useToast();
  const [preset, setPreset] = useState<FilterPreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const { thisMonthFrom, thisMonthTo, lastMonthFrom, lastMonthTo, currentYear, currentMonthIdx, lastMonthIdx } = useMemo(() => {
    const n = new Date();
    const lm = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    const tmLastDay = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    const lmLastDay = new Date(lm.getFullYear(), lm.getMonth() + 1, 0).getDate();
    return {
      thisMonthFrom: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`,
      thisMonthTo: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(tmLastDay).padStart(2, "0")}`,
      lastMonthFrom: `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, "0")}-01`,
      lastMonthTo: `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, "0")}-${String(lmLastDay).padStart(2, "0")}`,
      currentYear: n.getFullYear(),
      currentMonthIdx: n.getMonth(),
      lastMonthIdx: lm.getMonth(),
    };
  }, []);

  const { dateFrom, dateTo, rangeLabel } = useMemo(() => {
    switch (preset) {
      case "this_month":
        return { dateFrom: thisMonthFrom, dateTo: thisMonthTo, rangeLabel: `${MONTH_NAMES[currentMonthIdx]} ${currentYear}` };
      case "last_month":
        return { dateFrom: lastMonthFrom, dateTo: lastMonthTo, rangeLabel: `${MONTH_NAMES[lastMonthIdx]} ${currentYear}` };
      case "this_year":
        return { dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31`, rangeLabel: `Ano ${currentYear}` };
      case "custom":
        return {
          dateFrom: customFrom, dateTo: customTo,
          rangeLabel: customFrom || customTo
            ? `${customFrom ? formatDate(customFrom) : "Inicio"} - ${customTo ? formatDate(customTo) : "Fin"}`
            : "Seleccione fechas",
        };
    }
  }, [preset, customFrom, customTo, thisMonthFrom, thisMonthTo, lastMonthFrom, lastMonthTo, currentYear, currentMonthIdx, lastMonthIdx]);

  const filtered = useMemo(() => expenses.filter((e) => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  }), [expenses, dateFrom, dateTo]);

  const totalAmount = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  if (!isOpen) return null;

  const presets: { key: FilterPreset; label: string }[] = [
    { key: "this_month", label: "Este mes" },
    { key: "last_month", label: "Mes anterior" },
    { key: "this_year", label: `Ano ${currentYear}` },
    { key: "custom", label: "Personalizado" },
  ];

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Gastos");

      sheet.columns = [
        { header: "#", key: "num", width: 6 },
        { header: "Fecha", key: "date", width: 16 },
        { header: "Monto", key: "amount", width: 14 },
        { header: "Categoria", key: "category", width: 18 },
        { header: "Notas", key: "notes", width: 20 },
        { header: "Metodo", key: "method", width: 18 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
      headerRow.alignment = { horizontal: "center" };

      filtered.forEach((e, i) => {
        sheet.addRow({
          num: i + 1,
          date: formatDateExport(e.date),
          amount: e.amount,
          category: e.category,
          notes: e.notes || "",
          method: e.payment_method,
        });
      });

      sheet.getColumn("amount").numFmt = "$#,##0.00";

      const summary = workbook.addWorksheet("Resumen");
      summary.columns = [
        { header: "Categoria", key: "category", width: 20 },
        { header: "Total", key: "total", width: 14 },
        { header: "%", key: "pct", width: 10 },
      ];
      const sh = summary.getRow(1);
      sh.font = { bold: true, color: { argb: "FFFFFFFF" } };
      sh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
      sh.alignment = { horizontal: "center" };

      const catMap: Record<string, number> = {};
      filtered.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      Object.entries(catMap).sort(([, a], [, b]) => b - a).forEach(([cat, total]) => {
        summary.addRow({ category: cat, total, pct: totalAmount > 0 ? `${((total / totalAmount) * 100).toFixed(1)}%` : "0%" });
      });
      summary.getColumn("total").numFmt = "$#,##0.00";

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mifinanzas_${dateFrom || "inicio"}_${dateTo || "fin"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Excel exportado");
      onClose();
    } catch {
      toast("Error al exportar Excel", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("MiFinanzas", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(rangeLabel, 105, 28, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(99, 102, 241);
      doc.text(`Total: ${formatCurrency(totalAmount)}`, 105, 36, { align: "center" });

      autoTable(doc, {
        startY: 42,
        head: [["#", "Fecha", "Monto", "Categoria", "Notas", "Metodo"]],
        body: filtered.map((e, i) => [i + 1, formatDateExport(e.date), formatCurrency(e.amount), e.category, e.notes || "", e.payment_method]),
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "center", cellWidth: 24 },
          2: { halign: "right", cellWidth: 22 },
          3: { cellWidth: 28 },
          4: { cellWidth: 30 },
          5: { cellWidth: 28 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 3 },
        didDrawPage: (data) => {
          if (data.pageNumber === 1) {
            doc.setDrawColor(99, 102, 241);
            doc.setLineWidth(0.5);
            doc.line(14, 39, 196, 39);
          }
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Pagina ${data.pageNumber}`, 105, doc.internal.pageSize.height - 10, { align: "center" });
        },
      });

      doc.save(`mifinanzas_${dateFrom || "inicio"}_${dateTo || "fin"}.pdf`);
      toast("PDF exportado");
      onClose();
    } catch {
      toast("Error al exportar PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#C6C6C8]/30 dark:border-gray-700/50">
          <button onClick={onClose} className="text-[17px] text-[#007AFF] min-w-[70px] text-left">Cancelar</button>
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">Exportar Gastos</h2>
          <div className="min-w-[70px]" />
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-colors border-2 min-h-[48px] ${
                  preset === p.key
                    ? "border-accent bg-accent/10 text-primary dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary dark:text-white mb-1">Desde</label>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent outline-none text-base bg-white dark:bg-gray-800 text-primary dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary dark:text-white mb-1">Hasta</label>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent outline-none text-base bg-white dark:bg-gray-800 text-primary dark:text-white" />
              </div>
            </div>
          )}

          <div className="bg-surface dark:bg-gray-800 rounded-xl p-4 text-center space-y-1">
            <p className="text-xs text-muted dark:text-gray-400">{rangeLabel}</p>
            <p className="text-primary dark:text-white font-medium">{filtered.length} gasto{filtered.length !== 1 ? "s" : ""} a exportar</p>
            <p className="text-sm text-muted dark:text-gray-400">Total: {formatCurrency(totalAmount)}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleExportExcel} disabled={filtered.length === 0 || exporting}
              className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-base min-h-[48px]">
              {exporting ? "Exportando..." : "Excel"}
            </button>
            <button onClick={handleExportPDF} disabled={filtered.length === 0 || exporting}
              className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-base min-h-[48px]">
              {exporting ? "Exportando..." : "PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
