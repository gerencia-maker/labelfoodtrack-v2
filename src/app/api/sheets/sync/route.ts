import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  return withAuth(request, async (user) => {
    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { sheetId, gid } = await request.json();

    if (!sheetId) {
      return NextResponse.json({ error: "sheetId es requerido" }, { status: 400 });
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid || "0"}`;

    try {
      const res = await fetch(csvUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: "No se pudo acceder al Google Sheet. Verifica que sea publico." },
          { status: 400 }
        );
      }

      const csvText = await res.text();
      const rows = parseCSV(csvText);

      if (rows.length < 2) {
        return NextResponse.json({ error: "El sheet esta vacio o no tiene datos" }, { status: 400 });
      }

      // Skip header row
      const dataRows = rows.slice(1);
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
            refrigeratedDays: parseInt(row[4]) || 0,
            frozenDays: parseInt(row[5]) || 0,
            ambientDays: parseInt(row[6]) || 0,
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
            refrigeratedDays: parseInt(row[4]) || 0,
            frozenDays: parseInt(row[5]) || 0,
            ambientDays: parseInt(row[6]) || 0,
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
  });
}

/** Limpia comillas dobles de celdas CSV */
function cleanCell(val: string | undefined): string | null {
  if (!val) return null;
  return val.replace(/^"|"$/g, "").trim() || null;
}

/** Parser CSV simple que maneja comillas */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    rows.push(cells);
  }

  return rows;
}
