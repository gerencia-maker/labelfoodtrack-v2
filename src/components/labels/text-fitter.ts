/**
 * Algoritmo de text-fitting para etiquetas.
 * Portado de app.js v1 (lineas 51-168).
 *
 * Mide el texto con Canvas API y reduce el font-size iterativamente
 * hasta que el texto quepa en el contenedor.
 */

let fitCanvas: HTMLCanvasElement | null = null;
let fitCtx: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D {
  if (!fitCtx) {
    fitCanvas = document.createElement("canvas");
    fitCtx = fitCanvas.getContext("2d")!;
  }
  return fitCtx;
}

interface MeasureResult {
  height: number;
  lines: string[];
  lineHeight: number;
}

/** Mide texto con word-wrap usando Canvas */
function measureWrappedText(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
  maxWidth: number,
  lineHeightPx: number
): MeasureResult {
  const ctx = getContext();
  ctx.font = `${fontWeight || "normal"} ${fontSize}px ${fontFamily || "sans-serif"}`;

  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }

  const actualLineHeight = lineHeightPx || fontSize * 1.2;
  return {
    height: lines.length * actualLineHeight,
    lines,
    lineHeight: actualLineHeight,
  };
}

/** Resuelve el font-size minimo segun la clase CSS del elemento */
function resolveMinFont(className: string): number {
  if (className.includes("title")) return 14;
  if (className.includes("product-name")) return 12;
  if (className.includes("net-value")) return 11;
  if (className.includes("chip-value") || className.includes("alert-value")) return 10;
  return 8;
}

/** Ajusta el texto de un elemento para que quepa en su contenedor */
export function fitTextInElement(
  element: HTMLElement,
  options: { padding?: number; minFont?: number } = {}
): void {
  const text = element.textContent || "";
  if (!text.trim()) return;

  const padding = options.padding ?? 6;
  const minFont = options.minFont ?? resolveMinFont(element.className);

  const style = window.getComputedStyle(element);
  const originalFontSize = parseFloat(style.fontSize);
  const fontFamily = style.fontFamily;
  const fontWeight = style.fontWeight;

  const availableWidth = element.clientWidth - padding * 2;
  const availableHeight = element.clientHeight - padding * 2;

  if (availableWidth <= 0 || availableHeight <= 0) return;

  let fontSize = originalFontSize;
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;

  while (fontSize > minFont) {
    const result = measureWrappedText(
      text,
      fontSize,
      fontFamily,
      fontWeight,
      availableWidth,
      (lineHeight / originalFontSize) * fontSize
    );

    if (result.height <= availableHeight) break;
    fontSize -= 0.5;
  }

  element.style.fontSize = `${fontSize}px`;
  element.style.whiteSpace = "normal";
  element.style.overflow = "hidden";
  element.style.textOverflow = fontSize <= minFont ? "ellipsis" : "clip";
}

/** Ajusta todos los elementos con clase rancherito-* dentro de un contenedor */
export function fitAllLabels(container: HTMLElement): void {
  const targets = container.querySelectorAll<HTMLElement>(
    "[data-fit-text]"
  );

  targets.forEach((el) => {
    // Resetear font-size antes de recalcular
    el.style.fontSize = "";
    fitTextInElement(el);
  });
}
