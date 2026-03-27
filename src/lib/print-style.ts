export interface PrintPresetConfig {
  widthMm: number;
  heightMm: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

const STYLE_TAG_ID = "dynamic-print-style";

/**
 * Inject a <style> tag that overrides @page size and body dimensions
 * for printing. Called before window.print().
 */
export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  // Scale font size proportionally to paper height (base: 5pt at 45mm)
  const baseFontPt = Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));
  const headerFontPt = baseFontPt * 1.2;
  const qrMaxPx = Math.max(40, Math.min(200, Math.round(preset.heightMm * 2.5)));

  style.textContent = `
    @media print {
      @page {
        size: ${preset.widthMm}mm ${preset.heightMm}mm;
        margin: ${preset.marginTop}mm ${preset.marginRight}mm ${preset.marginBottom}mm ${preset.marginLeft}mm !important;
      }
      #printMatrixLabel {
        font-size: ${baseFontPt}pt !important;
      }
      #printMatrixLabel th {
        font-size: ${headerFontPt}pt !important;
      }
      #printMatrixLabel td {
        font-size: ${baseFontPt}pt !important;
      }
      #printMatrixLabel .multiline-row td {
        font-size: ${Math.max(3, baseFontPt - 0.5)}pt !important;
      }
      #printMatrixLabel .qr-cell canvas {
        max-width: ${qrMaxPx}px !important;
        max-height: ${qrMaxPx}px !important;
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
};
