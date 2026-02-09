import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const products = await prisma.product.findMany({
      where: { instanceId: user.instanceId },
      orderBy: { code: "asc" },
    });

    if (format === "csv") {
      const headers = [
        "Codigo",
        "Abreviatura Lote",
        "Nombre",
        "Categoria",
        "Sede",
        "Ingredientes",
        "Alergenos",
        "Conservacion",
        "Modo de Uso",
        "Envasado",
        "Dias Refrigerado",
        "Dias Congelado",
        "Dias Ambiente",
        "Calorias",
        "Grasa Total",
        "Carbohidratos",
        "Proteina",
        "Sodio",
        "Tamano Porcion",
        "Porciones por Envase",
      ];

      const rows = products.map((p: typeof products[number]) => [
        p.code,
        p.batchAbbr || "",
        p.name,
        p.category || "",
        p.sede || "",
        p.ingredients || "",
        p.allergens || "",
        p.storage || "",
        p.usage || "",
        p.packaging || "",
        p.refrigeratedDays,
        p.frozenDays,
        p.ambientDays,
        p.calories ?? "",
        p.fat ?? "",
        p.carbs ?? "",
        p.protein ?? "",
        p.sodium ?? "",
        p.servingSize ?? "",
        p.servingsPerContainer ?? "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: (string | number | null)[]) =>
          row.map((cell: string | number | null) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="productos_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  });
}
