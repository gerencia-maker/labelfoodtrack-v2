import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";

const MAX_SHEET_BYTES = 5 * 1024 * 1024;
const MAX_SHEET_ROWS = 5_000;
const MAX_CELL_LENGTH = 1_000;

const sheetSyncSchema = z
  .object({
    sheetId: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/),
    gid: z.string().regex(/^\d{1,20}$/).optional(),
  })
  .strict();

/**
 * POST /api/sheets/sync
 *
 * Importa productos desde Google Sheets (formato CSV publico).
 * Usa la URL publica de CSV del sheet: https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:csv&gid={gid}
 *
 * Body: { sheetId: string, gid?: string }
 *
 * Columnas esperadas (orden):
 * codigo | abreviatura | nombre | categoria | diasRefrigerado | diasCongelado | diasAmbiente | ingredientes | alergenos | conservacion | uso
 */
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "sync_sheets")) {
    return forbidden();
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const limited = enforceRateLimit(request, {
    scope: "sheets-sync",
    identifier: user.id,
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  const parsed = sheetSyncSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Identificador de Google Sheet invalido" }, { status: 400 });
  }
  const { sheetId, gid } = parsed.data;

  const csvUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid || "0")}`;

  try {
    const res = await fetch(csvUrl, {
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo acceder al Google Sheet. Verifica que sea publico." },
        { status: 400 }
      );
    }

    const declaredLength = Number(res.headers.get("content-length") || "0");
    if (declaredLength > MAX_SHEET_BYTES) {
      return NextResponse.json({ error: "El Google Sheet supera 5 MB" }, { status: 413 });
    }

    const csvText = await res.text();
    if (Buffer.byteLength(csvText, "utf8") > MAX_SHEET_BYTES) {
      return NextResponse.json({ error: "El Google Sheet supera 5 MB" }, { status: 413 });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = await workbook.csv.read(Readable.from(csvText));

    if (worksheet.rowCount < 2) {
      return NextResponse.json({ error: "El sheet esta vacio o no tiene datos" }, { status: 400 });
    }

    if (worksheet.rowCount - 1 > MAX_SHEET_ROWS) {
      return NextResponse.json(
        { error: `El sheet supera el limite de ${MAX_SHEET_ROWS} filas` },
        { status: 413 }
      );
    }

    // Skip header row
    const dataRows: string[][] = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      dataRows.push(
        Array.from({ length: 11 }, (_, index) =>
          row.getCell(index + 1).text.trim().slice(0, MAX_CELL_LENGTH)
        )
      );
    }
    let imported = 0;
    let skipped = 0;

    for (const row of dataRows) {
      const code = cleanCell(row[0]);
      const name = cleanCell(row[2]);

      if (!code || !name) {
        skipped++;
        continue;
      }

      await prisma.product.upsert({
        where: {
          code_instanceId: { code, instanceId: user.instanceId },
        },
        update: {
          batchAbbr: cleanCell(row[1]) || undefined,
          name,
          category: cleanCell(row[3]) || undefined,
          refrigeratedDays: parseDays(row[4]),
          frozenDays: parseDays(row[5]),
          ambientDays: parseDays(row[6]),
          ingredients: cleanCell(row[7]) || undefined,
          allergens: cleanCell(row[8]) || undefined,
          storage: cleanCell(row[9]) || undefined,
          usage: cleanCell(row[10]) || undefined,
        },
        create: {
          code,
          batchAbbr: cleanCell(row[1]),
          name,
          category: cleanCell(row[3]),
          refrigeratedDays: parseDays(row[4]),
          frozenDays: parseDays(row[5]),
          ambientDays: parseDays(row[6]),
          ingredients: cleanCell(row[7]),
          allergens: cleanCell(row[8]),
          storage: cleanCell(row[9]),
          usage: cleanCell(row[10]),
          instanceId: user.instanceId,
        },
      });
      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: dataRows.length,
    });
  } catch (err) {
    console.error("Sheets sync error:", err);
    return NextResponse.json(
      { error: "Error al sincronizar con Google Sheets" },
      { status: 500 }
    );
  }
}

/** Limpia comillas dobles de celdas CSV */
function cleanCell(val: string | undefined): string | null {
  if (!val) return null;
  return val.replace(/^"|"$/g, "").trim().slice(0, MAX_CELL_LENGTH) || null;
}

function parseDays(value: string | undefined): number {
  const parsed = Number.parseInt(value || "0", 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(3_650, Math.max(0, parsed));
}
