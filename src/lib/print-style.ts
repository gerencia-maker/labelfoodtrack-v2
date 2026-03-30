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
}

const STYLE_TAG_ID = "dynamic-print-style";

/**
 * Calculate the maximum font size that fits within the paper.
 * A label has ~10 rows (header counts as 2). Each row ≈ fontSize * 1.6 (line + padding).
 * 1mm ≈ 2.835pt
 */
function calcFittedFontPt(preset: PrintPresetConfig): number {
  const availH = (preset.heightMm - preset.marginTop - preset.marginBottom) * 2.835;
  const rows = 10; // header(2) + 8 data rows
  const maxFontFromHeight = availH / (rows * 1.6);

  // Also check width: labels column (30%) needs ~15 chars, value column (48%) ~25 chars
  // 1pt ≈ 0.6 avg char width. Available width in pt:
  const availW = (preset.widthMm - preset.marginLeft - preset.marginRight) * 2.835;
  const labelColW = availW * 0.3;
  const maxFontFromWidth = labelColW / (15 * 0.55);

  return Math.min(maxFontFromHeight, maxFontFromWidth);
}

/**
 * Inject a <style> tag that overrides @page size and body dimensions
 * for printing. Called before window.print().
 */
export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;

  // Calculate maximum font that fits
  const maxFontPt = calcFittedFontPt(preset);

  // Font size: user value capped to max, or auto-calculated
  let baseFontPt: number;
  if (preset.fontSize > 0) {
    baseFontPt = Math.min(preset.fontSize, maxFontPt);
  } else {
    baseFontPt = Math.max(3.5, Math.min(maxFontPt, (preset.heightMm / 45) * 5));
  }

  const headerFontPt = baseFontPt * 1.15;
  const subHeaderFontPt = baseFontPt * 0.85;
  const ingredientsFontPt = Math.max(3, baseFontPt * 0.85);

  // QR: proportional to available height (takes ~40% of height, in 22% width column)
  const availHmm = preset.heightMm - preset.marginTop - preset.marginBottom;
  const availWmm = preset.widthMm - preset.marginLeft - preset.marginRight;
  const qrMm = Math.min(availHmm * 0.5, availWmm * 0.2);
  const pxPerMm = preset.dpi / 25.4;
  const qrPx = Math.max(30, Math.round(qrMm * pxPerMm));

  // Page size
  const pageSize = preset.orientation === "landscape"
    ? `${preset.widthMm}mm ${preset.heightMm}mm landscape`
    : `${preset.heightMm}mm ${preset.widthMm}mm portrait`;

  style.textContent = `
    @media print {
      @page {
        size: ${pageSize};
        margin: 0mm !important;
      }
      #printMatrixContainer {
        padding: ${preset.marginTop}mm ${preset.marginRight}mm ${preset.marginBottom}mm ${preset.marginLeft}mm !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      #printMatrixLabel {
        font-size: ${baseFontPt}pt !important;
        width: 100% !important;
        height: 100% !important;
      }
      #printMatrixLabel table {
        width: 100% !important;
        height: 100% !important;
        table-layout: fixed !important;
      }
      #printMatrixLabel th {
        font-size: ${headerFontPt}pt !important;
      }
      #printMatrixLabel th .sub-header {
        font-size: ${subHeaderFontPt}pt !important;
      }
      #printMatrixLabel td {
        font-size: ${baseFontPt}pt !important;
      }
      #printMatrixLabel .multiline-row td {
        font-size: ${ingredientsFontPt}pt !important;
      }
      #printMatrixLabel .qr-cell {
        width: ${qrMm}mm !important;
      }
      #printMatrixLabel .qr-cell canvas {
        width: ${qrPx}px !important;
        height: ${qrPx}px !important;
        max-width: ${qrPx}px !important;
        max-height: ${qrPx}px !important;
      }
    }
  `;
  document.head.appendChild(style);
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
  fontSize: 0, // 0 = auto
};
