"use client";

import { QRCodeCanvas } from "qrcode.react";
import type { LabelPreviewData } from "./label-preview";

interface LabelPrintProps {
  data: LabelPreviewData;
  /** When true, renders a screen-visible preview (not hidden) */
  screenPreview?: boolean;
}

/**
 * Componente de impresion: tabla matricial 3 columnas con QR inline.
 * Portado de v1 app.js buildPrintMatrixHtml() (lineas 5185-5249).
 * Se muestra solo al imprimir (hidden en pantalla, block en print via CSS).
 * Con screenPreview=true se muestra en pantalla como preview real.
 */
export function LabelPrint({ data, screenPreview }: LabelPrintProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "--") return "--";
    try {
      // Handle both "YYYY-MM-DD" and full ISO "2026-03-23T00:00:00.000Z"
      const raw = dateStr.includes("T") ? dateStr : dateStr + "T00:00:00";
      const d = new Date(raw);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-CO");
    } catch {
      return dateStr;
    }
  };

  const hasRefrigerated = data.expiryRefrigerated && data.expiryRefrigerated !== "--";
  const hasFrozen = data.expiryFrozen && data.expiryFrozen !== "--";

  // Extra rows inside QR area: ingredients, allergens, storage, usage
  const extraRows = [
    data.ingredients ? 1 : 0,
    data.allergens ? 1 : 0,
    data.storage ? 1 : 0,
    data.usage ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Count body rows that share the QR column (everything before Destino/Lote)
  const qrRowSpan = 5 + (hasRefrigerated ? 1 : 0) + (hasFrozen ? 1 : 0) + extraRows;

  return (
    <div id={screenPreview ? undefined : "printMatrixContainer"} className={screenPreview ? "screen-print-preview" : undefined}>
      <div id={screenPreview ? undefined : "printMatrixLabel"} className={screenPreview ? "screen-matrix-label" : undefined}>
        <table>
          <thead>
            <tr>
              <th colSpan={3}>
                <div>{data.brand || "MARCA"}</div>
                <div style={{ fontSize: "0.7em", fontWeight: 400, marginTop: 2 }}>USO GASTRONÓMICO / INSTITUCIONAL</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Producto:</td>
              <td>{data.productName || "--"}</td>
              <td rowSpan={qrRowSpan} className="qr-cell">
                {data.qrData ? (
                  <QRCodeCanvas
                    value={data.qrData}
                    size={screenPreview ? 140 : 200}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <span style={{ fontSize: "5pt", color: "#999" }}>QR</span>
                )}
              </td>
            </tr>
            <tr>
              <td>Tipo de cadena de frío:</td>
              <td>{data.coldChain || "--"}</td>
            </tr>
            <tr>
              <td>Fecha de producción:</td>
              <td>{formatDate(data.productionDate)}</td>
            </tr>
            {hasRefrigerated && (
              <tr>
                <td>{hasFrozen ? "Post-descongelación:" : "Vence (refrigerado 0°C a 4°C):"}</td>
                <td>{data.expiryRefrigerated}</td>
              </tr>
            )}
            {hasFrozen && (
              <tr>
                <td>Vence (congelado -18°C a -22°C):</td>
                <td>{data.expiryFrozen}</td>
              </tr>
            )}
            <tr>
              <td>Peso/Cantidad:</td>
              <td>{data.netContent || "--"}</td>
            </tr>
            <tr>
              <td>Envasado por:</td>
              <td>{data.packedBy || "--"}</td>
            </tr>
            {data.ingredients && (
              <tr className="multiline-row">
                <td>Ingredientes:</td>
                <td>{data.ingredients}</td>
              </tr>
            )}
            {data.allergens && (
              <tr className="multiline-row">
                <td>Alérgenos:</td>
                <td>{data.allergens}</td>
              </tr>
            )}
            {data.storage && (
              <tr className="multiline-row">
                <td>Conservación:</td>
                <td>{data.storage}</td>
              </tr>
            )}
            {data.usage && (
              <tr className="multiline-row">
                <td>Uso:</td>
                <td>{data.usage}</td>
              </tr>
            )}
            <tr>
              <td>Destino:</td>
              <td colSpan={2}>{data.destination || "--"}</td>
            </tr>
            <tr>
              <td>Lote:</td>
              <td colSpan={2}>{data.batch || "--"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
