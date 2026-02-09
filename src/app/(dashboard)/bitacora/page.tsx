"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Download, ClipboardList, Search, FileSpreadsheet, FileText } from "lucide-react";

interface BitacoraEntry {
  id: string;
  productName: string;
  category: string | null;
  coldChain: string | null;
  processDate: string | null;
  expiryRefrigerated: string | null;
  expiryFrozen: string | null;
  quantity: string | null;
  quantityProduced: string | null;
  packedBy: string | null;
  destination: string | null;
  batch: string | null;
  traceDate?: string | null;
  createdAt: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_ENTRIES: BitacoraEntry[] = [
  { id: "1", productName: "Pandequeso", category: "Panaderia", coldChain: "Refrigerado", processDate: "2026-02-09T08:00:00Z", expiryRefrigerated: "2026-02-14T08:00:00Z", expiryFrozen: "2026-03-11T08:00:00Z", quantity: "50 und", quantityProduced: "5 kg", packedBy: "Maria Lopez", destination: "ALZATE", batch: "PQ-090226", createdAt: "2026-02-09T08:00:00Z" },
  { id: "2", productName: "Arepa de Boyaca", category: "Panaderia", coldChain: "Congelado", processDate: "2026-02-09T07:00:00Z", expiryRefrigerated: "2026-02-16T07:00:00Z", expiryFrozen: "2026-04-10T07:00:00Z", quantity: "100 und", quantityProduced: "10 kg", packedBy: "Carlos Perez", destination: "MIRANORTE", batch: "AB-090226", createdAt: "2026-02-09T07:00:00Z" },
  { id: "3", productName: "Empanada de Carne", category: "Fritos", coldChain: "Refrigerado", processDate: "2026-02-08T10:00:00Z", expiryRefrigerated: "2026-02-11T10:00:00Z", expiryFrozen: "2026-03-25T10:00:00Z", quantity: "200 und", quantityProduced: "15 kg", packedBy: "Ana Garcia", destination: "NM", batch: "EM-080226", createdAt: "2026-02-08T10:00:00Z" },
  { id: "4", productName: "Queso Campesino", category: "Lacteos", coldChain: "Refrigerado", processDate: "2026-02-08T06:00:00Z", expiryRefrigerated: "2026-02-23T06:00:00Z", expiryFrozen: "2026-05-09T06:00:00Z", quantity: "20 bloques", quantityProduced: "8 kg", packedBy: "Maria Lopez", destination: "ALZATE", batch: "QS-080226", createdAt: "2026-02-08T06:00:00Z" },
  { id: "5", productName: "Bunuelo", category: "Fritos", coldChain: null, processDate: "2026-02-07T09:00:00Z", expiryRefrigerated: "2026-02-10T09:00:00Z", expiryFrozen: "2026-03-09T09:00:00Z", quantity: "150 und", quantityProduced: "12 kg", packedBy: "Carlos Perez", destination: "MIRANORTE", batch: "BU-070226", createdAt: "2026-02-07T09:00:00Z" },
];

const EXPORT_HEADERS = [
  "Id",
  "Categoria",
  "Producto",
  "Cadena de frio",
  "Fecha proceso",
  "F.V. Refrigeracion",
  "F.V. Congelacion",
  "Peso / Cantidad",
  "Cantidad producida",
  "Rotulado por",
  "Destino",
  "Lote",
  "Fecha Trazabilidad",
];

function getExportRows(entries: BitacoraEntry[]) {
  return entries.map((e, i) => [
    String(i + 1),
    e.category || "",
    e.productName,
    e.coldChain || "",
    formatDateShort(e.processDate),
    formatDateShort(e.expiryRefrigerated),
    formatDateShort(e.expiryFrozen),
    e.quantity || "",
    e.quantityProduced || "",
    e.packedBy || "",
    e.destination || "",
    e.batch || "",
    formatDateShort(e.traceDate || e.createdAt),
  ]);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BitacoraPage() {
  const [entries, setEntries] = useState<BitacoraEntry[]>(DEMO_MODE ? DEMO_ENTRIES : []);
  const [total, setTotal] = useState(DEMO_MODE ? DEMO_ENTRIES.length : 0);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [search, setSearch] = useState("");
  const { getToken, userData } = useAuth();
  const t = useTranslations("bitacora");

  const canDelete = userData?.role === "ADMIN" || userData?.role === "EDITOR";

  const filtered = entries.filter((e) =>
    e.productName.toLowerCase().includes(search.toLowerCase()) ||
    (e.batch && e.batch.toLowerCase().includes(search.toLowerCase())) ||
    (e.destination && e.destination.toLowerCase().includes(search.toLowerCase()))
  );

  const loadEntries = useCallback(async () => {
    if (DEMO_MODE) return;
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch("/api/bitacora?limit=200", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error loading bitacora:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este registro de bitacora?")) return;

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/bitacora/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);
    }
  };

  const handleExportXLS = () => {
    const rows = getExportRows(filtered);
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerCells = EXPORT_HEADERS.map(
      (h) => `<th style="background:#f2f2f2;font-weight:bold;border:1px solid #ccc;padding:4px">${esc(h)}</th>`
    ).join("");
    const bodyRows = rows.map(
      (row) => "<tr>" + row.map((cell) => `<td style="border:1px solid #ccc;padding:4px">${esc(cell)}</td>`).join("") + "</tr>"
    ).join("");

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Bitacora</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    downloadBlob(blob, `bitacora_${new Date().toISOString().split("T")[0]}.xls`);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", format: "tabloid" });
    const rows = getExportRows(filtered);

    doc.setFontSize(14);
    doc.text("Trazabilidad - Bitacora", 28, 24);
    doc.setFontSize(9);
    doc.text(`Registros: ${rows.length}  |  Fecha: ${new Date().toLocaleDateString("es-CO")}`, 28, 32);

    autoTable(doc, {
      head: [EXPORT_HEADERS],
      body: rows,
      startY: 38,
      margin: { left: 28, right: 28 },
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [242, 242, 242], textColor: [0, 0, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    doc.save(`bitacora_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportXLS}
            disabled={entries.length === 0}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("exportXLS")}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={entries.length === 0}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <FileText className="h-4 w-4" />
            {t("exportPDF")}
          </Button>
        </div>
      </div>

      {!loading && entries.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder={t("product") + ", " + t("batch") + ", " + t("destination")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">{t("empty")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-700/30">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("product")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("category")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("coldChain")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("processDate")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("expiryRef")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("expiryCong")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("quantity")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("produced")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("packedBy")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("destination")}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">{t("batch")}</th>
                {canDelete && (
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 dark:text-slate-300 w-12"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={`border-b border-slate-100 dark:border-slate-700/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors ${
                    idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/30 dark:bg-slate-700/10"
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{entry.productName}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{entry.category || "--"}</td>
                  <td className="px-3 py-2">
                    {entry.coldChain ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                        {entry.coldChain}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">--</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatDate(entry.processDate)}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatDate(entry.expiryRefrigerated)}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatDate(entry.expiryFrozen)}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{entry.quantity || "--"}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{entry.quantityProduced || "--"}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{entry.packedBy || "--"}</td>
                  <td className="px-3 py-2">
                    {entry.destination ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                        {entry.destination}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">--</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{entry.batch || "--"}</td>
                  {canDelete && (
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {filtered.length} de {total} registros
      </p>
    </div>
  );
}
