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

const STYLE_TAG_ID = "dynamic-print-style";

export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;

  const availH = preset.heightMm - preset.marginTop - preset.marginBottom;
  const availW = preset.widthMm - preset.marginLeft - preset.marginRight;

  // User font or auto
  const userFontPt = preset.fontSize > 0
    ? preset.fontSize
    : Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));

  // Calculate how much space this font needs (in mm)
  // 1pt = 0.353mm
  // Header: brand + subtitle ≈ font * 4
  // Each row: font * lineHeight + padding + border ≈ font * 1.5 + 0.5mm
  // Rows: product, chain, date, expiry, weight, packed, ingredients(x3), dest, lot = ~12 rows
  const ptToMm = 0.353;
  const headerH = userFontPt * ptToMm * 3;
  const rowH = userFontPt * ptToMm * 1.3 + 0.3;
  const totalContentH = headerH + (11 * rowH);

  // Scale to fit
  const scale = Math.min(1, availH / totalContentH);

  const baseFontPt = userFontPt * scale;
  const headerFontPt = baseFontPt * 1.15;
  const ingredientsFontPt = baseFontPt;

  // QR proportional
  const qrMm = Math.min(availW * 0.18, availH * 0.6);
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
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
      #printMatrixLabel {
        font-size: ${baseFontPt.toFixed(1)}pt !important;
        width: 100% !important;
        overflow: visible !important;
      }
      #printMatrixLabel table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
      }
      #printMatrixLabel th {
        font-size: ${headerFontPt}pt !important;
        padding: 0.3mm 0.5mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel td {
        font-size: ${baseFontPt}pt !important;
        padding: 0.2mm 0.5mm !important;
        overflow: hidden !important;
        word-break: break-word !important;
        line-height: 1.2 !important;
      }
      #printMatrixLabel td:first-child {
        width: 28% !important;
        white-space: nowrap !important;
      }
      #printMatrixLabel .multiline-row td {
        font-size: ${ingredientsFontPt}pt !important;
        line-height: 1.0 !important;
        max-height: ${availH * 0.2}mm !important;
        overflow: hidden !important;
      }
      #printMatrixLabel .qr-cell {
        width: ${qrMm}mm !important;
        padding: 0.3mm !important;
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
  printScale: 100,
};
