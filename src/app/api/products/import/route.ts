import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission, hasPermission } from "@/lib/permissions";
import * as XLSX from "xlsx";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 5_000;

interface ImportedProduct {
  code: string;
  batchAbbr: string | null;
  name: string;
  category: string | null;
  refrigeratedDays: number;
  frozenDays: number;
  ambientDays: number;
}

// Map Spanish headers → Product model field names
// Matches the export format exactly
const HEADER_MAP: Record<string, string> = {
  "Codigo": "code",
  "Abreviatura Lote": "batchAbbr",
  "Item": "name",
  "Categoria": "category",
  "Refrigeracion (dias)": "refrigeratedDays",
  "Congelacion (dias)": "frozenDays",
  "Temp. Ambiente (dias)": "ambientDays",
};

const INT_FIELDS = new Set(["refrigeratedDays", "frozenDays", "ambientDays"]);

function parseRow(raw: Record<string, unknown>): ImportedProduct | null {
  const row: Record<string, unknown> = {};

  for (const [header, field] of Object.entries(HEADER_MAP)) {
    const val = raw[header];

    if (field === "code" || field === "name") {
      const str = String(val ?? "").trim();
      if (!str) return null; // required
      row[field] = str;
      continue;
    }

    if (INT_FIELDS.has(field)) {
      const n = Number(val);
      row[field] = isNaN(n) ? 0 : Math.max(0, Math.round(n));
      continue;
    }

    // String fields
    const str = String(val ?? "").trim();
    row[field] = str || null;
  }

  return row as unknown as ImportedProduct;
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (
    !hasActionPermission(user.role, user.permisos, "products", "importar") &&
    !hasActionPermission(user.role, user.permisos, "configuration", "importar_datos") &&
    !hasPermission(user.role, user.permisos, "import")
  ) {
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

  if (file.size > MAX_IMPORT_BYTES) {
    return NextResponse.json({ error: "El archivo debe ser menor a 5 MB" }, { status: 413 });
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
  if (rawRows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json(
      { error: `El archivo supera el limite de ${MAX_IMPORT_ROWS} filas` },
      { status: 413 }
    );
  }

  // Validate headers
  const fileHeaders = Object.keys(rawRows[0]);
  const missing = ["Codigo", "Item"].filter((h) => !fileHeaders.includes(h));
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
      errors.push(`Fila ${i + 2}: Codigo o Item vacio, omitida`);
      continue;
    }

    const code = parsed.code as string;
    const dataWithoutCode: Omit<ImportedProduct, "code"> = {
      batchAbbr: parsed.batchAbbr,
      name: parsed.name,
      category: parsed.category,
      refrigeratedDays: parsed.refrigeratedDays,
      frozenDays: parsed.frozenDays,
      ambientDays: parsed.ambientDays,
    };

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
          data: { ...parsed, instanceId: user.instanceId },
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
    errors: errors.slice(0, 20),
  });
}
