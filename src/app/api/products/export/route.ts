import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { DEMO_PRODUCTS_BY_INSTANCE } from "@/lib/demo-data";
import * as XLSX from "xlsx";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasPermission(user.role, user.permisos, "export")) {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "xlsx";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[];

  if (DEMO_MODE) {
    if (user.instanceId && DEMO_PRODUCTS_BY_INSTANCE[user.instanceId]) {
      products = DEMO_PRODUCTS_BY_INSTANCE[user.instanceId];
    } else {
      products = Object.values(DEMO_PRODUCTS_BY_INSTANCE).flat();
    }
  } else {
    products = await prisma.product.findMany({
      where: { ...tenantWhere(user) },
      orderBy: [{ category: "asc" }, { code: "asc" }],
    });
  }

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

  const rows = products.map((p) => [
    p.code,
    p.batchAbbr || "",
    p.name,
    p.category || "",
    p.refrigeratedDays ?? 0,
    p.frozenDays ?? 0,
    p.ambientDays ?? 0,
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
