import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasPermission(user.role, user.permisos, "export")) {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "xlsx";

  const products = await prisma.product.findMany({
    where: { ...tenantWhere(user) },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  // Columns match the products index table exactly
  const headers = [
    "Codigo",
    "Abreviatura Lote",
    "Item",
    "Categoria",
    "Refrigeracion (dias)",
    "Congelacion (dias)",
    "Temp. Ambiente (dias)",
  ];

  const rows = products.map((p: typeof products[number]) => [
    p.code,
    p.batchAbbr || "",
    p.name,
    p.category || "",
    p.refrigeratedDays,
    p.frozenDays,
    p.ambientDays,
  ]);

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Auto-size columns
    ws["!cols"] = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...rows.map((r) => String(r[i]).length));
      return { wch: Math.min(maxLen + 2, 45) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="productos_${dateStr}.xlsx"`,
      },
    });
  }

  if (format === "csv") {
    const csvContent = [
      headers.join(","),
      ...rows.map((row: (string | number | null)[]) =>
        row.map((cell: string | number | null) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="productos_${dateStr}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
}
