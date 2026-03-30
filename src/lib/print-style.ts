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

export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;

  // Available area
  const availH = preset.heightMm - preset.marginTop - preset.marginBottom;
  const availW = preset.widthMm - preset.marginLeft - preset.marginRight;

  // Auto font: scale to paper height
  const baseFontPt = preset.fontSize > 0
    ? preset.fontSize
    : Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));

  const headerFontPt = baseFontPt * 1.15;
  const ingredientsFontPt = Math.max(3, baseFontPt * 0.8);

  // QR: 13% of paper width, max 70% of height
  const qrMm = Math.min(availW * 0.13, availH * 0.7);
  const pxPerMm = preset.dpi / 25.4;
  const qrPx = Math.max(20, Math.round(qrMm * pxPerMm));

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
        width: ${preset.widthMm}mm !important;
        height: ${preset.heightMm}mm !important;
        padding: ${preset.marginTop}mm ${preset.marginRight}mm ${preset.marginBottom}mm ${preset.marginLeft}mm !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      #printMatrixLabel {
        font-size: ${baseFontPt}pt !important;
        width: ${availW}mm !important;
        height: ${availH}mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel table {
        width: 100% !important;
        height: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
      }
      #printMatrixLabel th {
        font-size: ${headerFontPt}pt !important;
        padding: 0.3mm 0.5mm !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }
      #printMatrixLabel td {
        font-size: ${baseFontPt}pt !important;
        padding: 0.2mm 0.5mm !important;
        overflow: hidden !important;
        word-break: break-word !important;
      }
      #printMatrixLabel td:first-child {
        width: 28% !important;
        white-space: nowrap !important;
      }
      #printMatrixLabel td:nth-child(2) {
        width: auto !important;
      }
      #printMatrixLabel .multiline-row td {
        font-size: ${ingredientsFontPt}pt !important;
        line-height: 1.0 !important;
        max-height: ${availH * 0.25}mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel .multiline-row td:nth-child(2) {
        word-break: break-all !important;
      }
      #printMatrixLabel .qr-cell {
        width: ${qrMm}mm !important;
        padding: 0.5mm !important;
      }
      #printMatrixLabel .qr-cell canvas {
        width: ${qrPx}px !important;
        height: ${qrPx}px !important;
        max-width: 100% !important;
        max-height: 100% !important;
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
