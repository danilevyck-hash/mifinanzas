"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

type ParsedRow = {
  fecha: string;
  monto: string;
  categoria: string;
  notas: string;
  metodo_pago: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z_]/g, "")
  );
  const rows = lines.slice(1).map((l) => parseLine(l));
  return { headers, rows };
}

function mapRow(headers: string[], values: string[]): ParsedRow | null {
  const get = (keys: string[]): string => {
    for (const key of keys) {
      const idx = headers.indexOf(key);
      if (idx >= 0 && values[idx]) return values[idx];
    }
    return "";
  };

  const fecha = get(["fecha", "date"]);
  const monto = get(["monto", "amount", "valor"]);
  const categoria = get(["categoria", "category"]);
  const notas = get(["notas", "notes", "descripcion", "description"]);
  const metodo_pago = get(["metodo_pago", "metodo", "payment_method", "pago"]);

  if (!fecha || !monto) return null;

  return { fecha, monto, categoria, notas, metodo_pago };
}

export default function ImportModal({ isOpen, onClose, onComplete }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [failures, setFailures] = useState(0);
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRawRows(r);

      const mapped: ParsedRow[] = [];
      for (const row of r) {
        const m = mapRow(h, row);
        if (m) mapped.push(m);
      }
      setParsedRows(mapped);
      setDone(false);
      setProgress(0);
      setFailures(0);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setTotal(parsedRows.length);
    setProgress(0);
    setFailures(0);
    setDone(false);

    let failCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      try {
        const res = await authFetch("/api/personal-expenses", {
          method: "POST",
          body: JSON.stringify({
            date: row.fecha,
            amount: parseFloat(row.monto) || 0,
            category: row.categoria || "Sin categoria",
            notes: row.notas || undefined,
            payment_method: row.metodo_pago || "Yappy",
          }),
        });
        if (!res.ok) failCount++;
      } catch {
        failCount++;
      }
      setProgress(i + 1);
      setFailures(failCount);
    }

    setDone(true);
    setImporting(false);

    if (failCount === 0) {
      toast(`${parsedRows.length} gasto(s) importado(s)`);
    } else {
      toast(`${parsedRows.length - failCount} importado(s), ${failCount} fallido(s)`, "error");
    }

    onComplete();
  };

  const handleClose = () => {
    setHeaders([]);
    setRawRows([]);
    setParsedRows([]);
    setDone(false);
    setProgress(0);
    setFailures(0);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={handleClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl  w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Importar CSV</h2>
          <button
            onClick={handleClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Archivo CSV</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-500-light"
            />
            <p className="text-xs text-muted mt-1">
              Columnas esperadas: fecha, monto, categoria, notas, metodo_pago
            </p>
          </div>

          {parsedRows.length > 0 && !done && (
            <>
              <div>
                <p className="text-sm font-medium text-primary mb-2">
                  Vista previa ({parsedRows.length} filas validas de {rawRows.length} totales)
                </p>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left font-medium text-muted">Fecha</th>
                        <th className="px-3 py-2 text-left font-medium text-muted">Monto</th>
                        <th className="px-3 py-2 text-left font-medium text-muted">Categoria</th>
                        <th className="px-3 py-2 text-left font-medium text-muted">Notas</th>
                        <th className="px-3 py-2 text-left font-medium text-muted">Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2">{row.fecha}</td>
                          <td className="px-3 py-2">{row.monto}</td>
                          <td className="px-3 py-2">{row.categoria || "-"}</td>
                          <td className="px-3 py-2 truncate max-w-[120px]">{row.notas || "-"}</td>
                          <td className="px-3 py-2">{row.metodo_pago || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 5 && (
                  <p className="text-xs text-muted mt-1">...y {parsedRows.length - 5} filas mas</p>
                )}
              </div>

              {importing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted">
                    <span>Importando...</span>
                    <span>{progress} de {total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(progress / total) * 100}%` }}
                    />
                  </div>
                  {failures > 0 && (
                    <p className="text-xs text-red-500">{failures} fila(s) con error</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleImport}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
                >
                  Importar {parsedRows.length} gasto(s)
                </button>
              )}
            </>
          )}

          {done && (
            <div className="text-center py-4 space-y-2">
              <p className="text-lg font-semibold text-primary">
                Importacion completada
              </p>
              <p className="text-sm text-muted">
                {progress - failures} de {total} gastos importados exitosamente
              </p>
              {failures > 0 && (
                <p className="text-sm text-red-500">{failures} fila(s) fallaron</p>
              )}
              <button
                onClick={handleClose}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors min-h-[48px] text-base"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
