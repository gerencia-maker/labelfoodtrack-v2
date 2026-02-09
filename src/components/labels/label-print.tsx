"use client";

import { QRCodeCanvas } from "qrcode.react";
import type { LabelPreviewData } from "./label-preview";

interface LabelPrintProps {
  data: LabelPreviewData;
}

/**
 * Componente de impresion: tabla matricial 3 columnas con QR inline.
 * Portado de v1 app.js buildPrintMatrixHtml() (lineas 5185-5249).
 * Se muestra solo al imprimir (hidden en pantalla, block en print via CSS).
 */
export function LabelPrint({ data }: LabelPrintProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "--") return "--";
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("es-CO");
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="printMatrixContainer">
      <div id="printMatrixLabel">
        <table>
          <thead>
            <tr>
              <th colSpan={3}>
                {data.brand || "MARCA"} USO GASTRON&Oacute;MICO
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Producto:</td>
              <td>{data.productName || "--"}</td>
              <td rowSpan={7} className="qr-cell">
                {data.qrData ? (
                  <QRCodeCanvas value={data.qrData} size={60} level="L" />
                ) : (
                  <span style={{ fontSize: "5pt", color: "#999" }}>QR</span>
                )}
              </td>
            </tr>
            <tr>
              <td>Tipo de cadena de fr\u00edo:</td>
              <td>{data.coldChain || "--"}</td>
            </tr>
            <tr>
              <td>Fecha de producci\u00f3n:</td>
              <td>{formatDate(data.productionDate)}</td>
            </tr>
            <tr>
              <td>Vence (refrigerado 0\u00b0C a 4\u00b0C):</td>
              <td>{data.expiryRefrigerated || "--"}</td>
            </tr>
            <tr>
              <td>Vence (congelado -18\u00b0C a -22\u00b0C):</td>
              <td>{data.expiryFrozen || "--"}</td>
            </tr>
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
                <td>Al\u00e9rgenos:</td>
                <td colSpan={2}>{data.allergens}</td>
              </tr>
            )}
            {data.storage && (
              <tr className="multiline-row">
                <td>Conservaci\u00f3n:</td>
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
