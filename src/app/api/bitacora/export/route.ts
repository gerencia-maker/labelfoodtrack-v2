import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const entries = await prisma.bitacoraEntry.findMany({
      where: { instanceId: user.instanceId },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
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

      const rows = entries.map((e) => [
        e.productName,
        e.category || "",
        e.coldChain || "",
        e.processDate ? e.processDate.toISOString().split("T")[0] : "",
        e.expiryRefrigerated ? e.expiryRefrigerated.toISOString().split("T")[0] : "",
        e.expiryFrozen ? e.expiryFrozen.toISOString().split("T")[0] : "",
        e.quantity || "",
        e.quantityProduced || "",
        e.packedBy || "",
        e.destination || "",
        e.batch || "",
        e.traceDate ? e.traceDate.toISOString().split("T")[0] : "",
        e.createdAt.toISOString().split("T")[0],
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="bitacora_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  });
}
