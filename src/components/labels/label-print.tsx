"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { LabelPreviewData } from "./label-preview";

interface LabelPrintProps {
  data: LabelPreviewData;
}

/**
 * Componente de impresion: tabla matricial optimizada para impresoras de etiquetas.
 * Portado de app.js v1 (lineas 5314-5649).
 * Se muestra solo al imprimir (display: none en pantalla).
 */
export function LabelPrint({ data }: LabelPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={printRef}
      className="label-print-matrix hidden print:block"
      style={{ fontFamily: "Arial, sans-serif", fontSize: "6pt", lineHeight: 1.1 }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7pt", marginBottom: "2px" }}>
        {data.brand || "MARCA"} — USO GASTRONOMICO
      </div>

      {/* Tabla matricial */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "0.5pt solid #333",
        }}
      >
        <tbody>
          <Row label="Producto" value={data.productName} />
          <Row label="Cadena de frio" value={data.coldChain} />
          <Row label="Contenido neto" value={data.netContent} />
          <Row label="Fecha produccion" value={
            data.productionDate
              ? new Date(data.productionDate + "T00:00:00").toLocaleDateString("es-CO")
              : "--"
          } />
          <Row label="Vence refrigerado" value={data.expiryRefrigerated} />
          {data.expiryFrozen !== "--" && (
            <Row label="Vence congelado" value={data.expiryFrozen} />
          )}
          <Row label="Lote" value={data.batch} />
          <Row label="Destino" value={data.destination} />
          <Row label="Empacado por" value={data.packedBy} />
          {data.ingredients && (
            <Row label="Ingredientes" value={data.ingredients} wide />
          )}
          {data.allergens && (
            <Row label="Alergenos" value={data.allergens} wide />
          )}
          {data.storage && (
            <Row label="Conservacion" value={data.storage} wide />
          )}
          {data.usage && (
            <Row label="Modo de uso" value={data.usage} wide />
          )}
        </tbody>
      </table>

      {/* QR en impresion */}
      {data.qrData && (
        <div style={{ textAlign: "right", marginTop: "1mm" }}>
          <QRCodeCanvas value={data.qrData} size={40} level="L" />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  const cellStyle: React.CSSProperties = {
    border: "0.5pt solid #666",
    padding: "1px 3px",
    verticalAlign: "top",
  };

  return (
    <tr>
      <td style={{ ...cellStyle, width: wide ? "20%" : "30%", fontWeight: "bold", whiteSpace: "nowrap" }}>
        {label}
      </td>
      <td style={{ ...cellStyle }} colSpan={wide ? 2 : 1}>
        {value || "--"}
      </td>
    </tr>
  );
}
