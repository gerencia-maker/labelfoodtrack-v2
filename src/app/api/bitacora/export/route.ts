import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission, hasPermission } from "@/lib/permissions";
import ExcelJS from "exceljs";
import { enforceRateLimit } from "@/lib/rate-limit";

function spreadsheetSafe(value: unknown): string {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (
    !hasPermission(user.role, user.permisos, "export") &&
    !hasActionPermission(user.role, user.permisos, "configuration", "exportar_datos") &&
    !hasActionPermission(user.role, user.permisos, "bitacora", "exportar")
  ) {
    return forbidden();
  }

  const limited = enforceRateLimit(request, {
    scope: "bitacora-export",
    identifier: user.id,
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const entries = await prisma.bitacoraEntry.findMany({
    where: { ...tenantWhere(user) },
    orderBy: { createdAt: "desc" },
    take: 10_000,
  });

  const headers = [
    "Producto",
    "Categoria",
    "Cadena Frio",
    "Fecha Proceso",
    "Vence Refrigerado",
    "Vence Congelado",
    "Cantidad",
    "Cantidad Producida",
    "Empacado Por",
    "Destino",
    "Lote",
    "Fecha Trazabilidad",
    "Creado",
  ];

  const rows = entries.map((e: typeof entries[number]) => [
    spreadsheetSafe(e.productName),
    spreadsheetSafe(e.category),
    spreadsheetSafe(e.coldChain),
    e.processDate ? e.processDate.toISOString().split("T")[0] : "",
    e.expiryRefrigerated ? e.expiryRefrigerated.toISOString().split("T")[0] : "",
    e.expiryFrozen ? e.expiryFrozen.toISOString().split("T")[0] : "",
    spreadsheetSafe(e.quantity),
    spreadsheetSafe(e.quantityProduced),
    spreadsheetSafe(e.packedBy),
    spreadsheetSafe(e.destination),
    spreadsheetSafe(e.batch),
    e.traceDate ? e.traceDate.toISOString().split("T")[0] : "",
    e.createdAt.toISOString().split("T")[0],
  ]);

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bitacora");
    worksheet.addRows([headers, ...rows]);
    worksheet.columns = headers.map((header, index) => ({
      width: Math.min(
        Math.max(header.length, ...rows.map((row) => String(row[index]).length)) + 2,
        45
      ),
    }));
    worksheet.getRow(1).font = { bold: true };
    const buf = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bitacora_${dateStr}.xlsx"`,
      },
    });
  }

  if (format === "csv") {
    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) =>
        row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bitacora_${dateStr}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
}
