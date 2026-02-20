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
  style.textContent = `
    @media print {
      @page {
        size: ${preset.widthMm}mm ${preset.heightMm}mm;
        margin: ${preset.marginTop}mm ${preset.marginRight}mm ${preset.marginBottom}mm ${preset.marginLeft}mm !important;
      }
      html, body {
        width: ${preset.widthMm}mm !important;
        height: ${preset.heightMm}mm !important;
        max-width: ${preset.widthMm}mm !important;
        max-height: ${preset.heightMm}mm !important;
      }
      #printMatrixContainer {
        width: ${preset.widthMm}mm !important;
        height: ${preset.heightMm}mm !important;
        max-width: ${preset.widthMm}mm !important;
        max-height: ${preset.heightMm}mm !important;
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
