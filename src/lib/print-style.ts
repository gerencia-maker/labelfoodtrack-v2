export interface PrintPresetConfig {
  widthMm: number;
  heightMm: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  orientation: "landscape" | "portrait";
  dpi: number;
  fontSize: number; // base font size in pt (0 = auto)
  printScale: number; // print scale % (100 = normal, 115 = 15% bigger)
}

export interface PrintLayout {
  pageWidthMm: number;
  pageHeightMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
  baseFontPt: number;
  headerFontPt: number;
  detailsFontPt: number;
  qrSizeMm: number;
}

/**
 * Keep the on-screen paper preview inside a useful viewport while preserving
 * the exact physical aspect ratio. This does not affect print dimensions.
 */
export function getPreviewWidthForViewportDvh(
  layout: Pick<PrintLayout, "pageWidthMm" | "pageHeightMm">,
  maxHeightDvh = 70
): number {
  return Math.max(1, maxHeightDvh * (layout.pageWidthMm / layout.pageHeightMm));
}

/**
 * Convert the label width to CSS pixels for explicit preview zoom levels.
 * CSS defines one inch as 96px, so this remains independent from printer DPI.
 */
export function getPreviewWidthPx(
  layout: Pick<PrintLayout, "pageWidthMm">,
  zoomPercent: number
): number {
  const safeZoom = Math.max(1, zoomPercent);
  return layout.pageWidthMm * (96 / 25.4) * (safeZoom / 100);
}

const STYLE_TAG_ID = "dynamic-print-style";

export function getPrintLayout(preset: PrintPresetConfig): PrintLayout {
  const rawWidth = Math.max(10, preset.widthMm);
  const rawHeight = Math.max(10, preset.heightMm);
  const pageWidthMm = preset.orientation === "landscape"
    ? Math.max(rawWidth, rawHeight)
    : Math.min(rawWidth, rawHeight);
  const pageHeightMm = preset.orientation === "landscape"
    ? Math.min(rawWidth, rawHeight)
    : Math.max(rawWidth, rawHeight);

  const printableWidthMm = Math.max(
    1,
    pageWidthMm - preset.marginLeft - preset.marginRight
  );
  const printableHeightMm = Math.max(
    1,
    pageHeightMm - preset.marginTop - preset.marginBottom
  );
  const contentScale = Math.min(2, Math.max(0.5, preset.printScale / 100));

  const automaticFontPt = Math.max(3.5, Math.min(7, (pageHeightMm / 45) * 5));
  const requestedFontPt = (preset.fontSize > 0 ? preset.fontSize : automaticFontPt) * contentScale;
  const ptToMm = 25.4 / 72;
  const estimatedHeightMm = requestedFontPt * ptToMm * 3
    + 11 * (requestedFontPt * ptToMm * 1.3 + 0.3);
  const fitScale = Math.min(1, printableHeightMm / estimatedHeightMm);
  const baseFontPt = Math.max(2.5, requestedFontPt * fitScale);
  const qrBaseMm = Math.min(printableWidthMm * 0.2, printableHeightMm * 0.58);
  const qrSizeMm = Math.min(
    printableWidthMm,
    printableHeightMm,
    Math.max(Math.min(12, qrBaseMm), qrBaseMm * Math.min(1.25, Math.max(0.75, contentScale)))
  );

  return {
    pageWidthMm,
    pageHeightMm,
    printableWidthMm,
    printableHeightMm,
    baseFontPt,
    headerFontPt: baseFontPt * 1.15,
    detailsFontPt: Math.max(2.5, baseFontPt * 0.75),
    qrSizeMm,
  };
}

export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = createPrintStyles(preset);
  document.head.appendChild(style);
}

export function createPrintStyles(preset: PrintPresetConfig): string {
  const layout = getPrintLayout(preset);

  return `
    @media print {
      @page {
        size: ${layout.pageWidthMm}mm ${layout.pageHeightMm}mm;
        margin: 0mm !important;
      }
      html, body {
        width: ${layout.pageWidthMm}mm !important;
        height: ${layout.pageHeightMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #printMatrixContainer {
        width: ${layout.pageWidthMm}mm !important;
        height: ${layout.pageHeightMm}mm !important;
        padding: ${preset.marginTop}mm ${preset.marginRight}mm ${preset.marginBottom}mm ${preset.marginLeft}mm !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      #printMatrixLabel {
        font-size: ${layout.baseFontPt.toFixed(2)}pt !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      #printMatrixLabel table {
        width: 100% !important;
        height: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #printMatrixLabel th {
        font-size: ${layout.headerFontPt.toFixed(2)}pt !important;
        padding: 0.3mm 0.5mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel td {
        font-size: ${layout.baseFontPt.toFixed(2)}pt !important;
        padding: 0.2mm 0.5mm !important;
        overflow: hidden !important;
        word-break: break-word !important;
        line-height: 1.2 !important;
      }
      #printMatrixLabel td:first-child {
        width: 28% !important;
        white-space: nowrap !important;
      }
      #printMatrixLabel .multiline-row td:first-child {
        font-size: ${layout.baseFontPt.toFixed(2)}pt !important;
        font-weight: 600 !important;
        vertical-align: middle !important;
        text-align: center !important;
        white-space: nowrap !important;
      }
      #printMatrixLabel .multiline-row td:nth-child(2) {
        font-size: ${layout.detailsFontPt.toFixed(2)}pt !important;
        line-height: 1.0 !important;
        max-height: ${layout.printableHeightMm * 0.2}mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel .qr-cell {
        width: ${layout.qrSizeMm}mm !important;
        padding: 0.3mm !important;
      }
      #printMatrixLabel .qr-cell canvas {
        width: ${layout.qrSizeMm}mm !important;
        height: ${layout.qrSizeMm}mm !important;
        max-width: 100% !important;
        max-height: 100% !important;
      }
    }
  `;
}

export const DEFAULT_PRINT_PRESET: PrintPresetConfig = {
  widthMm: 100,
  heightMm: 45,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  orientation: "landscape",
  dpi: 203,
  fontSize: 0,
  printScale: 100,
};
