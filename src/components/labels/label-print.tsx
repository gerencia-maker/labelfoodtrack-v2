"use client";

import type { CSSProperties } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import type { LabelPreviewData } from "./label-preview";
import {
  DEFAULT_PRINT_PRESET,
  getPreviewWidthForViewportDvh,
  getPreviewWidthPx,
  getPrintLayout,
  type PrintPresetConfig,
} from "@/lib/print-style";

interface LabelPrintProps {
  data: LabelPreviewData;
  /** When true, renders a screen-visible preview (not hidden) */
  screenPreview?: boolean;
  previewZoom?: "fit" | 50 | 100;
  preset?: PrintPresetConfig;
}

/**
 * Componente de impresion: tabla matricial 3 columnas con QR inline.
 * Con screenPreview=true se muestra en pantalla como preview real.
 */
export function LabelPrint({
  data,
  screenPreview,
  previewZoom = "fit",
  preset = DEFAULT_PRINT_PRESET,
}: LabelPrintProps) {
  const t = useTranslations("labels");
  const layout = getPrintLayout(preset);
  const previewViewportWidthDvh = getPreviewWidthForViewportDvh(layout);
  const requestedPreviewWidthPx =
    previewZoom === "fit" ? null : getPreviewWidthPx(layout, previewZoom);
  const mmInContainerUnits = 100 / layout.pageWidthMm;
  const ptToMm = 25.4 / 72;

  const previewContainerStyle = screenPreview
    ? ({
        aspectRatio: `${layout.pageWidthMm} / ${layout.pageHeightMm}`,
        width: requestedPreviewWidthPx === null ? "100%" : `${requestedPreviewWidthPx}px`,
        maxWidth:
          requestedPreviewWidthPx === null
            ? `min(1100px, ${previewViewportWidthDvh.toFixed(2)}dvh)`
            : "none",
        flex: "0 0 auto",
        marginInline: "auto",
        "--preview-font-size": `${layout.baseFontPt * ptToMm * mmInContainerUnits}cqw`,
        "--preview-header-size": `${layout.headerFontPt * ptToMm * mmInContainerUnits}cqw`,
        "--preview-details-size": `${layout.detailsFontPt * ptToMm * mmInContainerUnits}cqw`,
        "--preview-pad-y": `${0.2 * mmInContainerUnits}cqw`,
        "--preview-pad-x": `${0.5 * mmInContainerUnits}cqw`,
        "--preview-qr-size": `${layout.qrSizeMm * mmInContainerUnits}cqw`,
      } as CSSProperties)
    : undefined;
  const previewLabelStyle = screenPreview
    ? ({
        position: "absolute",
        left: `${(preset.marginLeft / layout.pageWidthMm) * 100}%`,
        top: `${(preset.marginTop / layout.pageHeightMm) * 100}%`,
        width: `${(layout.printableWidthMm / layout.pageWidthMm) * 100}%`,
        height: `${(layout.printableHeightMm / layout.pageHeightMm) * 100}%`,
      } as CSSProperties)
    : undefined;

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "--") return "--";
    try {
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
    <div
      id={screenPreview ? undefined : "printMatrixContainer"}
      className={screenPreview ? "screen-print-preview" : undefined}
      style={previewContainerStyle}
    >
      <div
        id={screenPreview ? undefined : "printMatrixLabel"}
        className={screenPreview ? "screen-matrix-label" : undefined}
        style={previewLabelStyle}
      >
        <table>
          <thead>
            <tr>
              <th colSpan={3}>
                <div>{data.brand || t("printBrand")}</div>
                <div style={{ fontSize: "0.7em", fontWeight: 400, marginTop: 2 }}>{t("printSubtitle")}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t("printProduct")}</td>
              <td>{data.productName || "--"}</td>
              <td rowSpan={qrRowSpan} className="qr-cell">
                {data.qrData ? (
                  <QRCodeCanvas
                    value={data.qrData}
                    size={512}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <span style={{ fontSize: "5pt", color: "#999" }}>QR</span>
                )}
              </td>
            </tr>
            <tr>
              <td>{t("printColdChain")}</td>
              <td>{data.coldChain || "--"}</td>
            </tr>
            <tr>
              <td>{t("printProductionDate")}</td>
              <td>{formatDate(data.productionDate)}</td>
            </tr>
            {hasRefrigerated && (
              <tr>
                <td>{hasFrozen ? t("printPostThaw") : t("printExpiryRef")}</td>
                <td>{data.expiryRefrigerated}</td>
              </tr>
            )}
            {hasFrozen && (
              <tr>
                <td>{t("printExpiryCong")}</td>
                <td>{data.expiryFrozen}</td>
              </tr>
            )}
            <tr>
              <td>{t("printWeight")}</td>
              <td>{data.netContent || "--"}</td>
            </tr>
            <tr>
              <td>{t("printPackedBy")}</td>
              <td>{data.packedBy || "--"}</td>
            </tr>
            {data.ingredients && (
              <tr className="multiline-row">
                <td>{t("printIngredients")}</td>
                <td>{data.ingredients}</td>
              </tr>
            )}
            {data.allergens && (
              <tr className="multiline-row">
                <td>{t("printAllergens")}</td>
                <td>{data.allergens}</td>
              </tr>
            )}
            {data.storage && (
              <tr className="multiline-row">
                <td>{t("printStorage")}</td>
                <td>{data.storage}</td>
              </tr>
            )}
            {data.usage && (
              <tr className="multiline-row">
                <td>{t("printUsage")}</td>
                <td>{data.usage}</td>
              </tr>
            )}
            <tr>
              <td>{t("printDestination")}</td>
              <td colSpan={2}>{data.destination || "--"}</td>
            </tr>
            <tr>
              <td>{t("printBatch")}</td>
              <td colSpan={2}>{data.batch || "--"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
