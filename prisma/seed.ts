import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Crear instancia RANCHERITO
  const rancherito = await prisma.instance.upsert({
    where: { id: "inst_rancherito" },
    update: {},
    create: {
      id: "inst_rancherito",
      name: "RANCHERITO",
      brandName: "RANCHERITO",
      destinations: ["ALZATE", "MIRANORTE", "NM"],
    },
  });
  console.log(`  Instance: ${rancherito.name}`);

  // 2. Crear instancia GRUPO DE LA TIERRA
  const grupotierra = await prisma.instance.upsert({
    where: { id: "inst_grupotierra" },
    update: {},
    create: {
      id: "inst_grupotierra",
      name: "GRUPO DE LA TIERRA",
      brandName: "GRUPO DE LA TIERRA",
      destinations: ["BOGOTA", "MEDELLIN"],
    },
  });
  console.log(`  Instance: ${grupotierra.name}`);

  // 3. Crear usuario admin de prueba
  const admin = await prisma.user.upsert({
    where: { firebaseUid: "test-admin-uid" },
    update: {},
    create: {
      firebaseUid: "test-admin-uid",
      email: "admin@rancherito.com",
      name: "Admin Rancherito",
      role: "ADMIN",
      status: "ACTIVE",
      instanceId: rancherito.id,
      canCreateLabel: true,
      canEditProduct: true,
      canEditBitacora: true,
      canUseAI: true,
    },
  });
  console.log(`  User: ${admin.name} (${admin.role})`);

  // 4. Crear usuario editor
  const editor = await prisma.user.upsert({
    where: { firebaseUid: "test-editor-uid" },
    update: {},
    create: {
      firebaseUid: "test-editor-uid",
      email: "editor@rancherito.com",
      name: "Editor Rancherito",
      role: "EDITOR",
      status: "ACTIVE",
      instanceId: rancherito.id,
      canCreateLabel: true,
      canEditProduct: true,
      canEditBitacora: true,
      canUseAI: true,
    },
  });
  console.log(`  User: ${editor.name} (${editor.role})`);

  // 5. Crear productos de ejemplo
  const productData = [
    {
      code: "R-01",
      batchAbbr: "PP0046",
      name: "Aji Rancherito",
      category: "Salsas",
      sede: "ALZATE",
      ingredients: "Aji, vinagre, sal, AJO, cebolla, especias",
      allergens: "ajo",
      storage: "Mantener refrigerado entre 0 y 4°C",
      usage: "Ideal como acompanamiento de platos tipicos",
      packaging: "Botella plastica",
      refrigeratedDays: 30,
      frozenDays: 0,
      ambientDays: 0,
      calories: 15,
      fat: 0.5,
      carbs: 2.5,
      protein: 0.3,
      sodium: 580,
      servingSize: 10,
      servingsPerContainer: 50,
    },
    {
      code: "R-02",
      batchAbbr: "PP0047",
      name: "Hogao Rancherito",
      category: "Salsas",
      sede: "ALZATE",
      ingredients: "Tomate, cebolla larga, AJO, aceite vegetal, sal, pimienta",
      allergens: "ajo",
      storage: "Mantener refrigerado entre 0 y 4°C",
      usage: "Base para sopas, guisos y acompanamiento",
      packaging: "Bolsa sellada",
      refrigeratedDays: 15,
      frozenDays: 90,
      ambientDays: 0,
      calories: 45,
      fat: 2.0,
      carbs: 5.5,
      protein: 0.8,
      sodium: 320,
      servingSize: 30,
      servingsPerContainer: 16,
    },
    {
      code: "R-03",
      batchAbbr: "PP0048",
      name: "Carne desmechada",
      category: "Carnicos",
      sede: "ALZATE",
      ingredients: "Carne de res, cebolla, tomate, AJO, sal, pimienta, comino",
      allergens: "",
      storage: "Mantener refrigerado entre 0 y 4°C. Congelar si no se usa en 3 dias",
      usage: "Calentar antes de servir. No recongelar despues de descongelar",
      packaging: "Bolsa sellada al vacio",
      refrigeratedDays: 5,
      frozenDays: 60,
      ambientDays: 0,
      calories: 180,
      fat: 8.5,
      carbs: 2.0,
      protein: 24.0,
      sodium: 450,
      servingSize: 150,
      servingsPerContainer: 4,
    },
    {
      code: "R-04",
      batchAbbr: "PP0049",
      name: "Arroz con pollo",
      category: "Platos preparados",
      sede: "ALZATE",
      ingredients: "Arroz, pollo, zanahoria, arveja, cebolla, AJO, sal, color, pimienta",
      allergens: "",
      storage: "Mantener refrigerado entre 0 y 4°C",
      usage: "Calentar en microondas o sarten. Consumir el mismo dia de descongelar",
      packaging: "Bandeja con film",
      refrigeratedDays: 3,
      frozenDays: 30,
      ambientDays: 0,
      calories: 220,
      fat: 6.0,
      carbs: 32.0,
      protein: 12.0,
      sodium: 380,
      servingSize: 300,
      servingsPerContainer: 1,
    },
    {
      code: "R-05",
      batchAbbr: "PP0050",
      name: "Pan de bono",
      category: "Panaderia",
      sede: "ALZATE",
      ingredients: "Almidon de yuca, QUESO costeño, fecula de maiz, HUEVO, mantequilla, sal",
      allergens: "lacteos, huevo",
      storage: "Mantener en lugar fresco y seco",
      usage: "Consumir preferiblemente caliente",
      packaging: "Bolsa papel kraft",
      refrigeratedDays: 0,
      frozenDays: 30,
      ambientDays: 3,
      calories: 310,
      fat: 14.0,
      carbs: 38.0,
      sugars: 2.0,
      protein: 8.0,
      sodium: 520,
      servingSize: 60,
      servingsPerContainer: 10,
    },
    {
      code: "R-06",
      batchAbbr: "PP0051",
      name: "Jugo de lulo",
      category: "Bebidas",
      sede: "ALZATE",
      ingredients: "Pulpa de lulo, agua, azucar",
      allergens: "",
      storage: "Mantener refrigerado entre 0 y 4°C. Agitar antes de servir",
      usage: "Servir frio. Consumir dentro de las 48 horas de abierto",
      packaging: "Botella PET",
      refrigeratedDays: 7,
      frozenDays: 90,
      ambientDays: 0,
      calories: 52,
      fat: 0.1,
      carbs: 12.5,
      sugars: 10.0,
      protein: 0.3,
      sodium: 5,
      servingSize: 250,
      servingsPerContainer: 4,
    },
  ];

  for (const p of productData) {
    await prisma.product.upsert({
      where: {
        code_instanceId: { code: p.code, instanceId: rancherito.id },
      },
      update: {},
      create: { ...p, instanceId: rancherito.id },
    });
  }
  console.log(`  ${productData.length} products created for RANCHERITO`);

  // 6. Crear etiquetas de ejemplo
  const labelData = [
    {
      productName: "Aji Rancherito",
      brand: "RANCHERITO",
      netContent: "500 g",
      productionDate: new Date("2026-02-08"),
      batch: "PP0046-080226-0930",
      packedBy: "Nuestra cocina intermedia Alzate Norena S.A.S",
      destination: "ALZATE",
    },
    {
      productName: "Hogao Rancherito",
      brand: "RANCHERITO",
      netContent: "480 g",
      productionDate: new Date("2026-02-07"),
      batch: "PP0047-070226-1400",
      packedBy: "Nuestra cocina intermedia Alzate Norena S.A.S",
      destination: "MIRANORTE",
    },
    {
      productName: "Carne desmechada",
      brand: "RANCHERITO",
      netContent: "600 g",
      productionDate: new Date("2026-02-09"),
      batch: "PP0048-090226-0800",
      packedBy: "Centro de acopio",
      destination: "NM",
    },
  ];

  for (const l of labelData) {
    await prisma.label.create({
      data: { ...l, instanceId: rancherito.id },
    });
  }
  console.log(`  ${labelData.length} labels created`);

  // 7. Crear entradas de bitacora
  const bitacoraData = [
    {
      productName: "Aji Rancherito",
      category: "Salsas",
      coldChain: "Refrigerado",
      processDate: new Date("2026-02-08"),
      expiryRefrigerated: new Date("2026-03-10"),
      quantity: "500 g",
      quantityProduced: "20",
      packedBy: "NCI Alzate",
      destination: "ALZATE",
      batch: "PP0046-080226-0930",
    },
    {
      productName: "Hogao Rancherito",
      category: "Salsas",
      coldChain: "Refrigerado",
      processDate: new Date("2026-02-07"),
      expiryRefrigerated: new Date("2026-02-22"),
      expiryFrozen: new Date("2026-05-08"),
      quantity: "480 g",
      quantityProduced: "15",
      packedBy: "NCI Alzate",
      destination: "MIRANORTE",
      batch: "PP0047-070226-1400",
    },
    {
      productName: "Carne desmechada",
      category: "Carnicos",
      coldChain: "Congelado",
      processDate: new Date("2026-02-09"),
      expiryRefrigerated: new Date("2026-02-14"),
      expiryFrozen: new Date("2026-04-10"),
      quantity: "600 g",
      quantityProduced: "30",
      packedBy: "Centro de acopio",
      destination: "NM",
      batch: "PP0048-090226-0800",
    },
  ];

  for (const b of bitacoraData) {
    await prisma.bitacoraEntry.create({
      data: { ...b, instanceId: rancherito.id },
    });
  }
  console.log(`  ${bitacoraData.length} bitacora entries created`);

  // 8. Crear preset de impresion
  await prisma.printPreset.upsert({
    where: { id: "preset_default" },
    update: {},
    create: {
      id: "preset_default",
      name: "Etiqueta estandar 100x55mm",
      widthMm: 100,
      heightMm: 55,
      marginTop: 2,
      marginRight: 2,
      marginBottom: 2,
      marginLeft: 2,
      orientation: "landscape",
      stockType: "die-cut",
      instanceId: rancherito.id,
    },
  });
  console.log("  1 print preset created");

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
