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
 * Inject a <style> tag that overrides @page size and body dimensions
 * for printing. Called before window.print().
 */
export function injectPrintStyles(preset: PrintPresetConfig): void {
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  // Font size: use manual value if set, otherwise auto-scale to paper height
  const baseFontPt = preset.fontSize > 0
    ? preset.fontSize
    : Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));
  const headerFontPt = baseFontPt * 1.2;
  const qrMaxPx = Math.max(40, Math.min(200, Math.round(preset.heightMm * 2.5)));

  style.textContent = `
    @media print {
      @page {
        size: ${preset.orientation === "landscape" ? `${preset.widthMm}mm ${preset.heightMm}mm landscape` : `${preset.heightMm}mm ${preset.widthMm}mm portrait`};
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
      #printMatrixContainer {
        padding-top: ${preset.marginTop}mm !important;
        padding-right: ${preset.marginRight}mm !important;
        padding-bottom: ${preset.marginBottom}mm !important;
        padding-left: ${preset.marginLeft}mm !important;
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
