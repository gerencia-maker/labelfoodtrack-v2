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
 * Inject print styles. Uses user fontSize directly and applies CSS scale
 * transform if content would overflow the paper.
 */
export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;

  // Available area in mm
  const availH = preset.heightMm - preset.marginTop - preset.marginBottom;
  const availW = preset.widthMm - preset.marginLeft - preset.marginRight;

  // Font: user value or auto
  const baseFontPt = preset.fontSize > 0
    ? preset.fontSize
    : Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));

  const headerFontPt = baseFontPt * 1.15;
  const ingredientsFontPt = Math.max(3, baseFontPt * 0.85);

  // Estimate content height at this font size (in mm)
  // Each row ≈ fontSize_pt * 0.5mm (empirical), header ≈ fontSize * 1.2mm
  const rowCount = 10;
  const estimatedH = (baseFontPt * 1.2) + (rowCount * baseFontPt * 0.55);

  // Scale factor: shrink if content overflows
  const scaleY = Math.min(1, availH / estimatedH);
  const scaleX = Math.min(1, availW / (baseFontPt * 15)); // rough width check
  const scaleFactor = Math.min(scaleX, scaleY);

  // QR size proportional to paper
  const pxPerMm = preset.dpi / 25.4;
  const qrMm = Math.min(availH * 0.45, availW * 0.2);
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
        width: ${preset.widthMm}mm !important;
        height: ${preset.heightMm}mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel {
        font-size: ${baseFontPt}pt !important;
        transform-origin: top left !important;
        transform: scale(${scaleFactor.toFixed(4)}) !important;
        width: ${(100 / scaleFactor).toFixed(2)}% !important;
      }
      #printMatrixLabel table {
        width: 100% !important;
        table-layout: fixed !important;
      }
      #printMatrixLabel th {
        font-size: ${headerFontPt}pt !important;
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
  fontSize: 0,
};
