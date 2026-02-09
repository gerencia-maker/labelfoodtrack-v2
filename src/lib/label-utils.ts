/**
 * Utilidades para el generador de etiquetas.
 * Portado de app.js v1 (lineas 2767-3480).
 */

/** Formatea fecha larga en espanol: "14 de enero de 2024" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Calcula fecha de vencimiento sumando dias a la fecha de produccion */
export function calculateExpiry(productionDate: string, days: number): string {
  if (!productionDate || days <= 0) return "--";
  const date = new Date(productionDate + "T00:00:00");
  if (isNaN(date.getTime())) return "--";
  date.setDate(date.getDate() + days);
  return formatLongDate(date);
}

/** Determina cadena de frio segun dias de conservacion */
export function resolveColdChain(
  refrigeratedDays: number,
  frozenDays: number,
  ambientDays: number
): string {
  if (frozenDays > 0) return "Congelado (-18 a -22°C)";
  if (refrigeratedDays > 0) return "Refrigerado (0 a 4°C)";
  if (ambientDays > 0) return "Ambiente";
  return "--";
}

/** Genera lote automatico: ABBR-DDMMYY-HHMM */
export function generateBatch(batchAbbr: string, productionDate: string): string {
  if (!batchAbbr || !productionDate) return "";
  const date = new Date(productionDate + "T00:00:00");
  if (isNaN(date.getTime())) return batchAbbr;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `${batchAbbr}-${dd}${mm}${yy}-${hh}${min}`;
}

/** Construye texto de cantidad con porcion */
export function buildQuantityLabel(
  netContent: string | null | undefined,
  servingSize: number | null | undefined
): string {
  if (!netContent) return "--";
  if (servingSize && servingSize > 0) {
    return `${netContent} - ${servingSize}g por porcion`;
  }
  return netContent;
}

/** Construye texto de vencimiento refrigerado/congelado */
export function buildExpiryText(
  productionDate: string,
  refrigeratedDays: number,
  frozenDays: number,
  ambientDays: number
): { refrigerated: string; frozen: string } {
  if (frozenDays > 0) {
    const frozenExpiry = calculateExpiry(productionDate, frozenDays);
    const refText = refrigeratedDays > 0
      ? `Despues de descongelacion: ${refrigeratedDays} dias`
      : "--";
    return { refrigerated: refText, frozen: frozenExpiry };
  }

  if (refrigeratedDays > 0) {
    return {
      refrigerated: calculateExpiry(productionDate, refrigeratedDays),
      frozen: "--",
    };
  }

  if (ambientDays > 0) {
    return {
      refrigerated: calculateExpiry(productionDate, ambientDays),
      frozen: "--",
    };
  }

  return { refrigerated: "--", frozen: "--" };
}
