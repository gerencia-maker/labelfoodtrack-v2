"use client";

import { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { fitAllLabels } from "./text-fitter";

export interface LabelPreviewData {
  brand: string;
  productName: string;
  netContent: string;
  productionDate: string;
  batch: string;
  coldChain: string;
  expiryRefrigerated: string;
  expiryFrozen: string;
  destination: string;
  packedBy: string;
  ingredients: string;
  allergens: string;
  storage: string;
  usage: string;
  qrData: string;
}

interface LabelPreviewProps {
  data: LabelPreviewData;
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === "--") return "--";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function LabelPreview({ data }: LabelPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      const timer = setTimeout(() => fitAllLabels(cardRef.current!), 50);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const hasAllergens = data.allergens && data.allergens.trim() !== "";
  const hasFrozen = data.expiryFrozen && data.expiryFrozen !== "--";

  return (
    <div
      ref={cardRef}
      className="rancherito-card bg-white rounded-2xl overflow-hidden"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.06)",
        maxWidth: "700px",
      }}
    >
      {/* Header: Marca + Badge */}
      <div
        className="text-center px-4 py-3"
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        <h1
          data-fit-text
          className="font-bold uppercase tracking-wider text-slate-900"
          style={{ fontSize: "1.3rem", letterSpacing: "0.04em" }}
        >
          {data.brand || "MARCA"}
        </h1>
        <span
          className="inline-block mt-1 px-2 py-0.5 rounded text-slate-600 uppercase font-medium"
          style={{ fontSize: "0.6rem", letterSpacing: "0.1em", background: "#f3f4f6" }}
        >
          Uso gastronomico / institucional
        </span>
      </div>

      {/* Producto + Contenido neto */}
      <div
        className="flex items-start justify-between px-4 py-3 gap-3"
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        <div className="min-w-0 flex-1">
          <div
            data-fit-text
            className="font-bold text-slate-900 leading-tight uppercase"
            style={{ fontSize: "1.4rem" }}
          >
            {data.productName || "Nombre del producto"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="uppercase font-medium text-slate-400"
            style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
          >
            Contenido neto
          </div>
          <div
            className="font-bold text-slate-900"
            style={{ fontSize: "1.3rem" }}
          >
            {data.netContent || "--"}
          </div>
        </div>
      </div>

      {/* Lote + Fecha produccion | Vencimientos */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
        {/* Chips: Lote y Fecha */}
        <div className="space-y-2">
          <Chip label="Lote" value={data.batch || "--"} />
          <Chip label="Produccion" value={formatDate(data.productionDate)} />
        </div>

        {/* Alerts: Vencimientos */}
        <div className="space-y-2">
          <Alert
            type="warm"
            label="Vence refrigerado"
            value={data.expiryRefrigerated || "--"}
          />
          {hasFrozen && (
            <Alert
              type="cold"
              label="Vence congelado"
              value={data.expiryFrozen}
            />
          )}
        </div>
      </div>

      {/* Cadena de frio + Destino */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <MetaCard label="Cadena de frio" value={data.coldChain || "--"} />
        <MetaCard label="Destino" value={data.destination || "--"} />
      </div>

      {/* Ingredientes + Alergenos */}
      {(data.ingredients || hasAllergens) && (
        <div className="px-4 py-3 space-y-2" style={{ borderBottom: "1px solid #e5e7eb" }}>
          {data.ingredients && (
            <div style={{ fontSize: "0.7rem", lineHeight: 1.4 }}>
              <span className="font-semibold text-slate-700">Ingredientes: </span>
              <span className="text-slate-500">{data.ingredients}</span>
            </div>
          )}
          {hasAllergens && (
            <div
              className="rounded-lg px-3 py-2"
              style={{
                background: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
                border: "1px solid #fde047",
                fontSize: "0.7rem",
              }}
            >
              <span className="font-bold" style={{ color: "#854d0e" }}>
                Alergenos: {data.allergens}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Conservacion + Modo de uso */}
      {(data.storage || data.usage) && (
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: data.storage && data.usage ? "1fr 1.2fr" : "1fr",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {data.storage && (
            <div
              className="px-4 py-3"
              style={{ borderRight: data.usage ? "1px solid #e5e7eb" : "none" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    width: "24px",
                    height: "24px",
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    color: "#2563eb",
                    fontSize: "12px",
                  }}
                >
                  ❄
                </div>
                <span
                  className="font-semibold text-slate-700 uppercase"
                  style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
                >
                  Conservacion
                </span>
              </div>
              <div className="text-slate-500" style={{ fontSize: "0.7rem", lineHeight: 1.4 }}>
                {data.storage}
              </div>
            </div>
          )}
          {data.usage && (
            <div className="px-4 py-3">
              <div
                className="font-semibold text-slate-700 uppercase mb-1"
                style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
              >
                Modo de uso
              </div>
              <div className="text-slate-500" style={{ fontSize: "0.7rem", lineHeight: 1.4 }}>
                {data.usage}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: Empacado por + QR */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1">
          <div
            className="uppercase font-medium text-slate-400"
            style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
          >
            Empacado por
          </div>
          <div
            className="font-bold text-slate-900 leading-tight"
            style={{ fontSize: "0.85rem" }}
          >
            {data.packedBy || "--"}
          </div>
        </div>
        <div className="shrink-0 ml-3">
          {data.qrData ? (
            <div
              className="rounded-lg overflow-hidden"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <QRCodeCanvas value={data.qrData} size={80} level="L" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 font-medium"
              style={{ width: "80px", height: "80px", fontSize: "0.7rem" }}
            >
              QR
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Chip: Lote, Fecha produccion */
function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}
    >
      <div
        className="uppercase font-medium text-slate-400"
        style={{ fontSize: "0.55rem", letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div className="font-bold text-slate-800" style={{ fontSize: "0.85rem" }}>
        {value}
      </div>
    </div>
  );
}

/** Alert: Vencimientos (warm=refrigerado, cold=congelado) */
function Alert({ type, label, value }: { type: "warm" | "cold"; label: string; value: string }) {
  const isWarm = type === "warm";
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: isWarm
          ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
          : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        borderLeft: `3px solid ${isWarm ? "#f59e0b" : "#3b82f6"}`,
      }}
    >
      <div
        className="uppercase font-medium"
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.1em",
          color: isWarm ? "#92400e" : "#1e40af",
        }}
      >
        {isWarm ? "🌡️" : "❄️"} {label}
      </div>
      <div
        className="font-bold"
        style={{
          fontSize: "0.85rem",
          color: isWarm ? "#92400e" : "#1e40af",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/** MetaCard: Cadena de frio, Destino */
function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
    >
      <div
        className="uppercase font-medium text-slate-400"
        style={{ fontSize: "0.55rem", letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div className="font-semibold text-slate-800" style={{ fontSize: "0.85rem" }}>
        {value}
      </div>
    </div>
  );
}
