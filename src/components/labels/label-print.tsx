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
      return new Date(dateStr + "T00:00:00").toLocaleDateString("es-CO");
    } catch {
      return dateStr;
    }
  };

  const hasRefrigerated = data.expiryRefrigerated && data.expiryRefrigerated !== "--";
  const hasFrozen = data.expiryFrozen && data.expiryFrozen !== "--";

  // Count body rows that have the QR rowSpan
  const qrRowSpan = 5 + (hasRefrigerated ? 1 : 0) + (hasFrozen ? 1 : 0);

  return (
    <div id={screenPreview ? undefined : "printMatrixContainer"} className={screenPreview ? "screen-print-preview" : undefined}>
      <div id={screenPreview ? undefined : "printMatrixLabel"} className={screenPreview ? "screen-matrix-label" : undefined}>
        <table>
          <thead>
            <tr>
              <th colSpan={3}>
                {data.brand || "MARCA"} USO GASTRONÓMICO
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Producto:</td>
              <td>{data.productName || "--"}</td>
              <td rowSpan={qrRowSpan} className="qr-cell">
                {data.qrData ? (
                  <QRCodeCanvas value={data.qrData} size={60} level="L" />
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
            <tr>
              <td>Destino:</td>
              <td colSpan={2}>{data.destination || "--"}</td>
            </tr>
            <tr>
              <td>Lote:</td>
              <td colSpan={2}>{data.batch || "--"}</td>
            </tr>
            {data.ingredients && (
              <tr className="multiline-row">
                <td>Ingredientes:</td>
                <td colSpan={2}>{data.ingredients}</td>
              </tr>
            )}
            {data.allergens && (
              <tr className="multiline-row">
                <td>Alérgenos:</td>
                <td colSpan={2}>{data.allergens}</td>
              </tr>
            )}
            {data.storage && (
              <tr className="multiline-row">
                <td>Conservación:</td>
                <td colSpan={2}>{data.storage}</td>
              </tr>
            )}
            {data.usage && (
              <tr className="multiline-row">
                <td>Uso:</td>
                <td colSpan={2}>{data.usage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
