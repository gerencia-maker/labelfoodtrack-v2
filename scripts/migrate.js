/**
 * Migracion Firestore → PostgreSQL (Plain JS - runs in Docker container)
 *
 * Uso en EasyPanel console:
 *   node scripts/migrate.js
 *
 * Requiere env vars: FIREBASE_SERVICE_ACCOUNT, DATABASE_URL
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Firebase Admin init
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error("ERROR: FIREBASE_SERVICE_ACCOUNT no configurado");
  process.exit(1);
}

const decoded = Buffer.from(serviceAccount, "base64").toString("utf-8");
const credentials = JSON.parse(decoded);
const app = initializeApp({ credential: cert(credentials) });
const firestore = getFirestore(app);

function mapRole(role) {
  const r = (role || "").toLowerCase();
  if (r === "gerente" || r === "admin") return "ADMIN";
  if (r === "coordinadora" || r === "cordinadora" || r === "editor") return "EDITOR";
  return "VIEWER";
}

const INSTANCES = [
  { firestoreId: "RANCHERITO", name: "RANCHERITO" },
  { firestoreId: "GRUPO DE LA TIERRA", name: "GRUPO DE LA TIERRA" },
];

async function cleanDB() {
  console.log("Limpiando base de datos...");
  await prisma.bitacoraEntry.deleteMany();
  await prisma.label.deleteMany();
  await prisma.product.deleteMany();
  await prisma.printPreset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.instance.deleteMany();
  console.log("  DB limpia");
}

async function migrateInstance(firestoreId, name) {
  console.log("\n=== Migrando instancia: " + name + " ===");

  // 1. Settings
  const settingsDoc = await firestore.doc("instances/" + firestoreId + "/settings/general").get();
  const settings = settingsDoc.data() || {};

  const instance = await prisma.instance.create({
    data: {
      name: name,
      brandName: settings.brandName || name,
      sheetId: settings.sheetId || null,
      sheetGid: settings.sheetGid || null,
      destinations: settings.destinations || [],
    },
  });
  console.log("  Instancia creada: " + instance.id);

  // 2. Usuarios
  const usersSnap = await firestore.collection("instances/" + firestoreId + "/users").get();
  let userCount = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const uid = doc.id;
    try {
      await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: data.email || uid + "@migrated.local",
          name: data.name || "Sin nombre",
          role: mapRole(data.role),
          status: data.status === "ACTIVO" ? "ACTIVE" : "INACTIVE",
          instanceId: instance.id,
          canCreateLabel: data.canCreateLabel || false,
          canEditProduct: data.canEditProduct || false,
          canEditBitacora: data.canEditBitacora || false,
          canUseAI: data.canUseAI !== undefined ? data.canUseAI : true,
          licenseEndDate: data.license && data.license.endDate && data.license.endDate.toDate ? data.license.endDate.toDate() : null,
        },
      });
      userCount++;
    } catch (err) {
      console.warn("  WARN usuario " + uid + ": " + err.message);
    }
  }
  console.log("  " + userCount + " usuarios migrados");

  // 3. Productos
  const productsSnap = await firestore.collection("instances/" + firestoreId + "/productCatalog").get();
  let productCount = 0;
  for (const doc of productsSnap.docs) {
    const d = doc.data();
    try {
      await prisma.product.create({
        data: {
          code: d.productCode || doc.id,
          batchAbbr: d.batchAbbr || null,
          name: d.productName || "Sin nombre",
          category: d.productCategory || null,
          sede: d.sede || null,
          ingredients: d.ingredients || null,
          allergens: d.allergens || null,
          storage: d.storage || null,
          usage: d.usage || null,
          packaging: d.packaging || null,
          refrigeratedDays: parseInt(d.refrigeratedDays) || 0,
          frozenDays: parseInt(d.frozenDays) || 0,
          ambientDays: parseInt(d.ambientDays) || 0,
          calories: parseFloat(d.calories) || null,
          fat: parseFloat(d.fat) || null,
          carbs: parseFloat(d.carbs) || null,
          protein: parseFloat(d.protein) || null,
          sodium: parseFloat(d.sodium) || null,
          servingSize: parseFloat(d.servingSize) || null,
          servingsPerContainer: parseFloat(d.servingsPerContainer) || null,
          instanceId: instance.id,
        },
      });
      productCount++;
    } catch (err) {
      console.warn("  WARN producto " + (d.productCode || doc.id) + ": " + err.message);
    }
  }
  console.log("  " + productCount + " productos migrados");

  // 4. Etiquetas + Bitacora
  const labelsSnap = await firestore.collection("instances/" + firestoreId + "/labels").get();
  let labelCount = 0;
  let bitacoraCount = 0;
  for (const doc of labelsSnap.docs) {
    const d = doc.data();
    const data = d.data || {};
    try {
      const productionDate = data.productionDate
        ? new Date(data.productionDate)
        : d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;

      const validDate = productionDate && !isNaN(productionDate.getTime()) ? productionDate : null;

      await prisma.label.create({
        data: {
          productName: d.name || data.productName || "Sin nombre",
          brand: settings.brandName || name,
          netContent: data.netContent || null,
          origin: data.origin || null,
          productionDate: validDate,
          batch: data.batch || null,
          packedBy: data.packedBy || null,
          destination: data.destination || null,
          instanceId: instance.id,
        },
      });
      labelCount++;

      // Bitacora
      const refDays = parseInt(data.refrigeratedDays) || 0;
      const frzDays = parseInt(data.frozenDays) || 0;
      const ambDays = parseInt(data.ambientDays) || 0;
      let coldChain = "--";
      if (frzDays > 0) coldChain = "Congelado";
      else if (refDays > 0) coldChain = "Refrigerado";
      else if (ambDays > 0) coldChain = "Ambiente";

      let expiryRef = null;
      let expiryFrz = null;
      if (validDate) {
        if (frzDays > 0) {
          expiryFrz = new Date(validDate);
          expiryFrz.setDate(expiryFrz.getDate() + frzDays);
        }
        if (refDays > 0) {
          expiryRef = new Date(validDate);
          expiryRef.setDate(expiryRef.getDate() + refDays);
        } else if (ambDays > 0) {
          expiryRef = new Date(validDate);
          expiryRef.setDate(expiryRef.getDate() + ambDays);
        }
      }

      await prisma.bitacoraEntry.create({
        data: {
          productName: d.name || data.productName || "Sin nombre",
          category: data.productCategory || null,
          coldChain: coldChain,
          processDate: validDate,
          expiryRefrigerated: expiryRef,
          expiryFrozen: expiryFrz,
          quantity: data.netContent || null,
          quantityProduced: data.productionCount ? String(data.productionCount) : null,
          packedBy: data.packedBy || null,
          destination: data.destination || null,
          batch: data.batch || null,
          traceDate: data.traceTimestamp ? new Date(data.traceTimestamp) : null,
          instanceId: instance.id,
        },
      });
      bitacoraCount++;
    } catch (err) {
      console.warn("  WARN label " + doc.id + ": " + err.message);
    }
  }
  console.log("  " + labelCount + " etiquetas migradas");
  console.log("  " + bitacoraCount + " entradas de bitacora");

  // 5. Print preset
  const printDoc = await firestore.doc("instances/" + firestoreId + "/settings/print").get();
  const printData = printDoc.data();
  if (printData) {
    await prisma.printPreset.create({
      data: {
        name: printData.stockName || "Default",
        widthMm: printData.widthMm || 100,
        heightMm: printData.heightMm || 55,
        marginTop: printData.marginTopMm || 0,
        marginRight: printData.marginRightMm || 0,
        marginBottom: printData.marginBottomMm || 0,
        marginLeft: printData.marginLeftMm || 0,
        orientation: printData.orientation || "portrait",
        stockType: printData.stockType || null,
        instanceId: instance.id,
      },
    });
    console.log("  Print preset migrado");
  }

  return instance;
}

async function main() {
  console.log("=== Migracion Firestore -> PostgreSQL ===");
  console.log("Fecha: " + new Date().toISOString() + "\n");

  await cleanDB();

  for (const inst of INSTANCES) {
    try {
      await migrateInstance(inst.firestoreId, inst.name);
    } catch (err) {
      console.error("ERROR migrando " + inst.name + ":", err);
    }
  }

  const [instances, users, products, labels, bitacora] = await Promise.all([
    prisma.instance.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.label.count(),
    prisma.bitacoraEntry.count(),
  ]);

  console.log("\n=== Resumen ===");
  console.log("  Instancias: " + instances);
  console.log("  Usuarios:   " + users);
  console.log("  Productos:  " + products);
  console.log("  Etiquetas:  " + labels);
  console.log("  Bitacora:   " + bitacora);
  console.log("\nMigracion completa!");
}

main()
  .catch(function (e) {
    console.error("Error fatal:", e);
    process.exit(1);
  })
  .finally(async function () {
    await prisma.$disconnect();
  });
