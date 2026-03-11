import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import * as XLSX from "xlsx";

// Map Spanish headers → Product model field names
const HEADER_MAP: Record<string, string> = {
  "Codigo": "code",
  "Abreviatura Lote": "batchAbbr",
  "Nombre": "name",
  "Categoria": "category",
  "Sede": "sede",
  "Ingredientes": "ingredients",
  "Alergenos": "allergens",
  "Conservacion": "storage",
  "Modo de Uso": "usage",
  "Envasado": "packaging",
  "Dias Refrigerado": "refrigeratedDays",
  "Dias Congelado": "frozenDays",
  "Dias Ambiente": "ambientDays",
  "Calorias": "calories",
  "Energia (kJ)": "energyKj",
  "Grasa Total": "fat",
  "Grasa Saturada": "saturatedFat",
  "Carbohidratos": "carbs",
  "Azucares": "sugars",
  "Fibra": "fiber",
  "Proteina": "protein",
  "Sodio": "sodium",
  "Tamano Porcion": "servingSize",
  "Porciones por Envase": "servingsPerContainer",
};

const INT_FIELDS = new Set(["refrigeratedDays", "frozenDays", "ambientDays"]);
const FLOAT_FIELDS = new Set([
  "calories", "energyKj", "fat", "saturatedFat", "carbs",
  "sugars", "fiber", "protein", "sodium", "servingSize", "servingsPerContainer",
]);

function parseRow(raw: Record<string, unknown>): Record<string, unknown> | null {
  const row: Record<string, unknown> = {};

  for (const [header, field] of Object.entries(HEADER_MAP)) {
    const val = raw[header];

    if (field === "code" || field === "name") {
      const str = String(val ?? "").trim();
      if (!str) return null; // required fields
      row[field] = str;
      continue;
    }

    if (INT_FIELDS.has(field)) {
      const n = Number(val);
      row[field] = isNaN(n) ? 0 : Math.max(0, Math.round(n));
      continue;
    }

    if (FLOAT_FIELDS.has(field)) {
      if (val === "" || val === null || val === undefined) {
        row[field] = null;
      } else {
        const n = Number(val);
        row[field] = isNaN(n) ? null : n;
      }
      continue;
    }

    // String fields
    const str = String(val ?? "").trim();
    row[field] = str || null;
  }

  return row;
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "products", "crear")) {
    return forbidden();
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) {
    return NextResponse.json({ error: "Archivo vacio" }, { status: 400 });
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "No se encontraron filas" }, { status: 400 });
  }

  // Validate headers
  const fileHeaders = Object.keys(rawRows[0]);
  const requiredHeaders = ["Codigo", "Nombre"];
  const missing = requiredHeaders.filter((h) => !fileHeaders.includes(h));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Columnas requeridas faltantes: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = parseRow(rawRows[i]);
    if (!parsed) {
      skipped++;
      errors.push(`Fila ${i + 2}: Codigo o Nombre vacio, omitida`);
      continue;
    }

    const code = parsed.code as string;
    const { code: _code, ...dataWithoutCode } = parsed;

    try {
      const existing = await prisma.product.findFirst({
        where: { code, instanceId: user.instanceId },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: dataWithoutCode,
        });
        updated++;
      } else {
        await prisma.product.create({
          data: { ...parsed, instanceId: user.instanceId } as Parameters<typeof prisma.product.create>[0]["data"],
        });
        created++;
      }
    } catch (err) {
      skipped++;
      errors.push(`Fila ${i + 2} (${code}): ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  }

  return NextResponse.json({
    total: rawRows.length,
    created,
    updated,
    skipped,
    errors: errors.slice(0, 20), // limit error list
  });
}
