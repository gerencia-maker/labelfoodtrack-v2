/**
 * Demo data sourced from: PRODUCTOS - LABELFOODTRACK.csv
 * Real products for RANCHERITO (57) and GRUPO DE LA TIERRA (20)
 */

const P = "demo-inst-1"; // RANCHERITO
const G = "demo-inst-2"; // GRUPO DE LA TIERRA

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D = Record<string, any>;

export const DEMO_PRODUCTS_BY_INSTANCE: Record<string, D[]> = {
  [P]: [
    // ── COCINA INTERMEDIA ──
    { id: "1", code: "R-01", batchAbbr: "PP0003", name: "AJI RANCHERITO", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 90, ambientDays: 0, ingredients: "sal / pimienta / marrano", allergens: "contiene nueces", storage: "Conservese cerrado en temperatura de congelación -18 aprox, los cambios de temperatura afecta la calidad sensorial del producto, despues de abierto consumir en el menor tiempo posible.", usage: "Se recomienda su uso para acompañar las proteinas y mejorar su experiencia sensorial.", instanceId: P },
    { id: "2", code: "R-02", batchAbbr: "PP0021", name: "CHIMICHURRI", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 60, ambientDays: 0, ingredients: "Piña, salsa de tomate, tocineta, azucar, cebolla, apio, pimenton, naranja, vinagre, margarina.", allergens: "contiene mani", storage: "Conservese cerrado en temperatura de congelación -18 aprox, los cambios de temperatura afecta la calidad sensorial del producto, despues de abierto consumir en el menor tiempo posible.", usage: "Se recomienda su uso para acompañar las proteinas y mejorar su experiencia sensorial.", instanceId: P },
    { id: "3", code: "R-03", batchAbbr: "PP0056", name: "SALSA TARTARA", category: "COCINA INTERMEDIA", refrigeratedDays: 2, frozenDays: 30, ambientDays: 0, instanceId: P },
    { id: "4", code: "R-04", batchAbbr: "PP0057", name: "VINAGRETA DE LA CASA", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "5", code: "R-05", batchAbbr: "PP0220", name: "VINAGRETA DE MORA", category: "COCINA INTERMEDIA", refrigeratedDays: 15, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "6", code: "R-06", batchAbbr: "PP0206", name: "SALSA BURGUER", category: "COCINA INTERMEDIA", refrigeratedDays: 20, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "7", code: "R-07", batchAbbr: "PP001", name: "ALIÑOS DE LINEA AMARILLA", category: "COCINA INTERMEDIA", refrigeratedDays: 15, frozenDays: 40, ambientDays: 0, instanceId: P },
    { id: "8", code: "R-08", batchAbbr: "PP002", name: "MASA DE LINEA AMARILLA", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "9", code: "R-09", batchAbbr: "PP0006", name: "ALIÑOS DE PREPARACIONES CALIENTES", category: "COCINA INTERMEDIA", refrigeratedDays: 10, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "10", code: "R-10", batchAbbr: "PP0046", name: "SALSA AGRIDULCE", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "11", code: "R-11", batchAbbr: "PP0047", name: "SALSA DE CHAMPIÑONES", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "12", code: "R-12", batchAbbr: "PP0049", name: "SALSA DE POSTA DULCE", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "13", code: "R-13", batchAbbr: "PP0051", name: "SALSA DE GRATINAR", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "14", code: "R-14", batchAbbr: "PP0052", name: "SALSA MARINERA", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "15", code: "R-15", batchAbbr: "PP0138", name: "ADEREZO CARNES BLANCAS", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "16", code: "R-16", batchAbbr: "PP0287", name: "BASE CAZUELA DE MARISCOS", category: "COCINA INTERMEDIA", refrigeratedDays: 2, frozenDays: 30, ambientDays: 0, instanceId: P },
    { id: "17", code: "R-17", batchAbbr: "PP0041", name: "PASTEL DE POLLO", category: "COCINA INTERMEDIA", refrigeratedDays: 7, frozenDays: 90, ambientDays: 1, instanceId: P },
    { id: "18", code: "R-18", batchAbbr: "PP0026", name: "EMPANADA PV", category: "COCINA INTERMEDIA", refrigeratedDays: 0, frozenDays: 0, ambientDays: 120, instanceId: P },
    { id: "19", code: "R-19", batchAbbr: "PP0297", name: "EMPANADA DE ARROZ Y CARNE DESMECHADA", category: "COCINA INTERMEDIA", refrigeratedDays: 7, frozenDays: 90, ambientDays: 1, instanceId: P },
    { id: "20", code: "R-20", batchAbbr: "PP0285", name: "AREPAS DE QUESO", category: "COCINA INTERMEDIA", refrigeratedDays: 0, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "21", code: "R-21", batchAbbr: "CG0021", name: "PATACONES", category: "COCINA INTERMEDIA", refrigeratedDays: 2, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "22", code: "R-22", batchAbbr: "PP0205", name: "MINIPATACONES", category: "COCINA INTERMEDIA", refrigeratedDays: 2, frozenDays: 0, ambientDays: 0, instanceId: P },
    // ── ACOPIO ──
    { id: "23", code: "R-23", batchAbbr: "CD0001", name: "CARNE DE CERDO PORCIONADO O CERDO ENTERA", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "24", code: "R-24", batchAbbr: "CD0006", name: "CARNE DE MONDONGO", category: "ACOPIO", refrigeratedDays: 12, frozenDays: 45, ambientDays: 0, instanceId: P },
    { id: "25", code: "R-25", batchAbbr: "CD0007", name: "CARNE TIPICA DE CERDO X 105 GR", category: "ACOPIO", refrigeratedDays: 12, frozenDays: 45, ambientDays: 0, instanceId: P },
    { id: "26", code: "R-26", batchAbbr: "CD0038", name: "TIPICA CERDO 220G", category: "ACOPIO", refrigeratedDays: 9, frozenDays: 30, ambientDays: 0, instanceId: P },
    { id: "27", code: "R-27", batchAbbr: "CD0030", name: "MANERO DE CERDO EN CANAL", category: "ACOPIO", refrigeratedDays: 9, frozenDays: 30, ambientDays: 0, instanceId: P },
    { id: "28", code: "R-28", batchAbbr: "CD0013", name: "CHICHARRON TIPICO 120 GR", category: "ACOPIO", refrigeratedDays: 12, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "29", code: "R-29", batchAbbr: "CD0014", name: "CHICHARRON TIPICO X 200 GR", category: "ACOPIO", refrigeratedDays: 12, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "30", code: "R-30", batchAbbr: "CD0012", name: "CHICHARRON GRANDE X 410 GR", category: "ACOPIO", refrigeratedDays: 12, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "31", code: "R-31", batchAbbr: "CD0009", name: "CHICHARRON CAZUELA", category: "ACOPIO", refrigeratedDays: 10, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "32", code: "R-32", batchAbbr: "CD0011", name: "CHICHARRON GARRA", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "33", code: "R-33", batchAbbr: "CD0010", name: "CHICHARRON CAZUELA AHUMADO", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "34", code: "R-34", batchAbbr: "CD0008", name: "CHICHARRON AHUMADO X 500 GR", category: "ACOPIO", refrigeratedDays: 15, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "35", code: "R-35", batchAbbr: "CD0026", name: "CARNE DE MOLER CERDO", category: "ACOPIO", refrigeratedDays: 0, frozenDays: 0, ambientDays: 0, instanceId: P },
    { id: "36", code: "R-36", batchAbbr: "CD0030", name: "MANERO DE CERDO EN CANAL", category: "ACOPIO", refrigeratedDays: 15, frozenDays: 60, ambientDays: 0, instanceId: P },
    { id: "37", code: "R-37", batchAbbr: "CD0028", name: "EMPELLA", category: "ACOPIO", refrigeratedDays: 15, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "38", code: "R-38", batchAbbr: "CD0017", name: "COSTILLA", category: "ACOPIO", refrigeratedDays: 10, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "39", code: "R-39", batchAbbr: "CD0024", name: "RECORTE COSTILLA", category: "ACOPIO", refrigeratedDays: 5, frozenDays: 150, ambientDays: 0, instanceId: P },
    { id: "40", code: "R-40", batchAbbr: "CD0022", name: "MEDALLON DE CERDO", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 150, ambientDays: 0, instanceId: P },
    { id: "41", code: "R-41", batchAbbr: "RE0008", name: "CARNE TIPICA DE RES X 130 GR", category: "ACOPIO", refrigeratedDays: 1, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "42", code: "R-42", batchAbbr: "RE0023", name: "TIPICA RES 220 GR", category: "ACOPIO", refrigeratedDays: 7, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "43", code: "R-43", batchAbbr: "RE0004", name: "CARNE DE MOLER RES", category: "ACOPIO", refrigeratedDays: 7, frozenDays: 150, ambientDays: 0, instanceId: P },
    { id: "44", code: "R-44", batchAbbr: "RE0027", name: "PUNTA DE ANCA X 220 GR", category: "ACOPIO", refrigeratedDays: 7, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "45", code: "R-45", batchAbbr: "RE0028", name: "PUNTA DE ANCA X 320 GR", category: "ACOPIO", refrigeratedDays: 20, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "46", code: "R-46", batchAbbr: "RE0050", name: "GOULASH DE RES", category: "ACOPIO", refrigeratedDays: 5, frozenDays: 270, ambientDays: 0, instanceId: P },
    { id: "47", code: "R-47", batchAbbr: "RE0027", name: "SOLOMITO X 250 GR", category: "ACOPIO", refrigeratedDays: 10, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "48", code: "R-48", batchAbbr: "RE0028", name: "MEDALLON DE SOLOMITO X 120 GM", category: "ACOPIO", refrigeratedDays: 10, frozenDays: 180, ambientDays: 0, instanceId: P },
    { id: "49", code: "R-49", batchAbbr: "RE0050", name: "GOULASH DE RES", category: "ACOPIO", refrigeratedDays: 10, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "50", code: "R-50", batchAbbr: "RE0009", name: "CHURRASCO X 300 GR", category: "ACOPIO", refrigeratedDays: 5, frozenDays: 150, ambientDays: 0, instanceId: P },
    { id: "51", code: "R-51", batchAbbr: "RE0016", name: "LENGUA DE RES PORCIONADA X 250g", category: "ACOPIO", refrigeratedDays: 5, frozenDays: 150, ambientDays: 0, instanceId: P },
    { id: "52", code: "R-52", batchAbbr: "RE0023", name: "POSTA DE RES 220 GR", category: "ACOPIO", refrigeratedDays: 10, frozenDays: 90, ambientDays: 0, instanceId: P },
    { id: "53", code: "R-53", batchAbbr: "RE0004", name: "CARNE DE MOLER RES", category: "ACOPIO", refrigeratedDays: 3, frozenDays: 30, ambientDays: 0, instanceId: P },
    { id: "54", code: "R-54", batchAbbr: "RE0006", name: "CARNE DESMECHADA", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "55", code: "R-55", batchAbbr: "CD0027", name: "CARNE DE MOLER MIXTA", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "56", code: "R-56", batchAbbr: "CD0027", name: "CARNE DE MOLER MIXTA", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 120, ambientDays: 0, instanceId: P },
    { id: "57", code: "R-57", batchAbbr: "CD0045456", name: "PORCUETA", category: "ACOPIO", refrigeratedDays: 4, frozenDays: 120, ambientDays: 0, instanceId: P },
  ],
  [G]: [
    // ── BEBIDAS ──
    { id: "g1", code: "R-01", batchAbbr: "PP001", name: "BEBIDA NATURAL BOTELLA 250ml", category: "BEBIDAS", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g2", code: "R-02", batchAbbr: "PP002", name: "JUGO DE LULO NATURAL", category: "BEBIDAS", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g3", code: "R-03", batchAbbr: "PP003", name: "JUGO MANGO BICHE SIN AZUCAR", category: "BEBIDAS", refrigeratedDays: 6, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g4", code: "R-04", batchAbbr: "PP004", name: "JUGO BOLSA PIÑA NARANJA", category: "BEBIDAS", refrigeratedDays: 6, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g5", code: "R-05", batchAbbr: "PP005", name: "FRUTA CORTADA COSECHA CUBOS", category: "FRUTA PROCESADA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g6", code: "R-06", batchAbbr: "PP006", name: "LIMONADA", category: "BEBIDAS", refrigeratedDays: 6, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g7", code: "R-07", batchAbbr: "PP007", name: "FRUTA CORTADA AROMATICA", category: "FRUTA PROCESADA", refrigeratedDays: 0, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g8", code: "R-08", batchAbbr: "PP008", name: "JUGO FRUTOS ROJOS", category: "BEBIDAS", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g9", code: "R-09", batchAbbr: "PP009", name: "JUGO NARANJA NATURAL", category: "BEBIDAS", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g10", code: "R-10", batchAbbr: "PP010", name: "JUGO MANDARINA NATURAL", category: "BEBIDAS", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    // ── FRUTA PROCESADA ──
    { id: "g11", code: "R-11", batchAbbr: "PP011", name: "SUPREMAS DE MELON", category: "FRUTA PROCESADA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g12", code: "R-12", batchAbbr: "PP012", name: "SUPREMAS DE PAPAYA", category: "FRUTA PROCESADA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g13", code: "R-13", batchAbbr: "PP013", name: "SUPREMAS DE PIÑA", category: "FRUTA PROCESADA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g14", code: "R-14", batchAbbr: "PP014", name: "PAPA PASTUSA PELADA VACIO", category: "FRUTA PROCESADA", refrigeratedDays: 6, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g15", code: "R-15", batchAbbr: "PP015", name: "PAPA SABANERA CUBOS VACIO", category: "FRUTA PROCESADA", refrigeratedDays: 6, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g16", code: "R-16", batchAbbr: "PP016", name: "PIÑA EN RODAJAS", category: "BEBIDAS", refrigeratedDays: 5, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g17", code: "R-17", batchAbbr: "PP017", name: "FRESA EN CUBOS", category: "FRUTA PROCESADA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g18", code: "R-18", batchAbbr: "PP018", name: "MORA CONGELADA", category: "FRUTA PROCESADA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g19", code: "R-19", batchAbbr: "PP019", name: "JUGO MARACUMANGO NATURAL", category: "BEBIDAS", refrigeratedDays: 6, frozenDays: 60, ambientDays: 0, storage: "Mantener en refrigeración", instanceId: G },
    { id: "g20", code: "R-20", batchAbbr: "PP020", name: "ALBAHACA DESHOJADA", category: "FRUTA PROCESADA", refrigeratedDays: 10, frozenDays: 0, ambientDays: 6, storage: "Mantener en refrigeración", instanceId: G },
  ],
};

export const DEMO_LABELS_BY_INSTANCE: Record<string, D[]> = {
  [P]: [
    { id: "1", productName: "AJI RANCHERITO", brand: "RANCHERITO", batch: "PP0003-090226-0800", destination: "ALZATE", createdAt: "2026-02-09T08:30:00Z", product: { code: "R-01", name: "AJI RANCHERITO", category: "COCINA INTERMEDIA" }, instanceId: P },
    { id: "2", productName: "CHIMICHURRI", brand: "RANCHERITO", batch: "PP0021-090226-0700", destination: "MIRANORTE", createdAt: "2026-02-09T07:15:00Z", product: { code: "R-02", name: "CHIMICHURRI", category: "COCINA INTERMEDIA" }, instanceId: P },
    { id: "3", productName: "PASTEL DE POLLO", brand: "RANCHERITO", batch: "PP0041-080226-1000", destination: "NM", createdAt: "2026-02-08T10:45:00Z", product: { code: "R-17", name: "PASTEL DE POLLO", category: "COCINA INTERMEDIA" }, instanceId: P },
    { id: "4", productName: "CHICHARRON TIPICO 120 GR", brand: "RANCHERITO", batch: "CD0013-080226-0600", destination: "ALZATE", createdAt: "2026-02-08T06:20:00Z", product: { code: "R-28", name: "CHICHARRON TIPICO 120 GR", category: "ACOPIO" }, instanceId: P },
    { id: "5", productName: "CARNE TIPICA DE RES X 130 GR", brand: "RANCHERITO", batch: "RE0008-070226-0900", destination: "MIRANORTE", createdAt: "2026-02-07T09:00:00Z", product: { code: "R-41", name: "CARNE TIPICA DE RES X 130 GR", category: "ACOPIO" }, instanceId: P },
  ],
  [G]: [
    { id: "g-l1", productName: "JUGO DE LULO NATURAL", brand: "GRUPO DE LA TIERRA", batch: "PP002-090226", destination: "BOGOTA", createdAt: "2026-02-09T10:00:00Z", product: { code: "R-02", name: "JUGO DE LULO NATURAL", category: "BEBIDAS" }, instanceId: G },
    { id: "g-l2", productName: "FRUTA CORTADA COSECHA CUBOS", brand: "GRUPO DE LA TIERRA", batch: "PP005-080226", destination: "MEDELLIN", createdAt: "2026-02-08T09:00:00Z", product: { code: "R-05", name: "FRUTA CORTADA COSECHA CUBOS", category: "FRUTA PROCESADA" }, instanceId: G },
  ],
};

export const DEMO_ENTRIES_BY_INSTANCE: Record<string, D[]> = {
  [P]: [
    { id: "1", productName: "AJI RANCHERITO", category: "COCINA INTERMEDIA", coldChain: "Refrigerado", processDate: "2026-02-09T08:00:00Z", expiryRefrigerated: "2026-02-13T08:00:00Z", expiryFrozen: "2026-05-10T08:00:00Z", quantity: "50 und", quantityProduced: "5 kg", packedBy: "Maria Lopez", destination: "ALZATE", batch: "PP0003-090226", createdAt: "2026-02-09T08:00:00Z", instanceId: P },
    { id: "2", productName: "CHIMICHURRI", category: "COCINA INTERMEDIA", coldChain: "Congelado", processDate: "2026-02-09T07:00:00Z", expiryRefrigerated: "2026-02-17T07:00:00Z", expiryFrozen: "2026-04-10T07:00:00Z", quantity: "100 und", quantityProduced: "10 kg", packedBy: "Carlos Perez", destination: "MIRANORTE", batch: "PP0021-090226", createdAt: "2026-02-09T07:00:00Z", instanceId: P },
    { id: "3", productName: "PASTEL DE POLLO", category: "COCINA INTERMEDIA", coldChain: "Refrigerado", processDate: "2026-02-08T10:00:00Z", expiryRefrigerated: "2026-02-15T10:00:00Z", expiryFrozen: "2026-05-09T10:00:00Z", quantity: "200 und", quantityProduced: "15 kg", packedBy: "Ana Garcia", destination: "NM", batch: "PP0041-080226", createdAt: "2026-02-08T10:00:00Z", instanceId: P },
    { id: "4", productName: "CHICHARRON TIPICO 120 GR", category: "ACOPIO", coldChain: "Refrigerado", processDate: "2026-02-08T06:00:00Z", expiryRefrigerated: "2026-02-20T06:00:00Z", expiryFrozen: "2026-05-09T06:00:00Z", quantity: "20 bloques", quantityProduced: "8 kg", packedBy: "Maria Lopez", destination: "ALZATE", batch: "CD0013-080226", createdAt: "2026-02-08T06:00:00Z", instanceId: P },
    { id: "5", productName: "CARNE TIPICA DE RES X 130 GR", category: "ACOPIO", coldChain: null, processDate: "2026-02-07T09:00:00Z", expiryRefrigerated: "2026-02-08T09:00:00Z", expiryFrozen: "2026-08-06T09:00:00Z", quantity: "150 und", quantityProduced: "12 kg", packedBy: "Carlos Perez", destination: "MIRANORTE", batch: "RE0008-070226", createdAt: "2026-02-07T09:00:00Z", instanceId: P },
  ],
  [G]: [
    { id: "g-e1", productName: "JUGO DE LULO NATURAL", category: "BEBIDAS", coldChain: "Refrigerado", processDate: "2026-02-09T10:00:00Z", expiryRefrigerated: "2026-02-13T10:00:00Z", expiryFrozen: "2026-04-10T10:00:00Z", quantity: "30 und", quantityProduced: "6 kg", packedBy: "Juan Rios", destination: "BOGOTA", batch: "PP002-090226", createdAt: "2026-02-09T10:00:00Z", instanceId: G },
    { id: "g-e2", productName: "FRUTA CORTADA COSECHA CUBOS", category: "FRUTA PROCESADA", coldChain: "Refrigerado", processDate: "2026-02-08T11:00:00Z", expiryRefrigerated: "2026-02-12T11:00:00Z", expiryFrozen: "2026-04-09T11:00:00Z", quantity: "25 und", quantityProduced: "8 kg", packedBy: "Laura Diaz", destination: "MEDELLIN", batch: "PP005-080226", createdAt: "2026-02-08T11:00:00Z", instanceId: G },
  ],
};
