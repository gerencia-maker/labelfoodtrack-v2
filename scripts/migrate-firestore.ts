/**
 * Script de migracion: Firestore → PostgreSQL
 *
 * Uso:
 *   npx tsx scripts/migrate-firestore.ts
 *
 * Requiere:
 *   - FIREBASE_SERVICE_ACCOUNT en .env (base64 del JSON de service account)
 *   - DATABASE_URL en .env (PostgreSQL)
 *
 * Migra:
 *   1. Instancias (settings/general → Instance)
 *   2. Usuarios (/instances/{id}/users → User)
 *   3. Productos (/instances/{id}/productCatalog → Product)
 *   4. Etiquetas (/instances/{id}/labels → Label + BitacoraEntry)
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Firebase Admin init
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error("ERROR: FIREBASE_SERVICE_ACCOUNT no configurado en .env");
  process.exit(1);
}

const decoded = Buffer.from(serviceAccount, "base64").toString("utf-8");
const credentials = JSON.parse(decoded);

const app = initializeApp({ credential: cert(credentials) });
const firestore = getFirestore(app);

// Mapeo de roles Firestore → Prisma
function mapRole(role: string): "ADMIN" | "EDITOR" | "VIEWER" {
  const r = role?.toLowerCase();
  if (r === "gerente" || r === "admin") return "ADMIN";
  if (r === "coordinadora" || r === "cordinadora" || r === "editor") return "EDITOR";
  return "VIEWER";
}

// Instances a migrar
const INSTANCES = [
  { firestoreId: "RANCHERITO", name: "RANCHERITO" },
  { firestoreId: "GRUPO DE LA TIERRA", name: "GRUPO DE LA TIERRA" },
];

async function migrateInstance(firestoreId: string, name: string) {
  console.log(`\n=== Migrando instancia: ${name} ===`);

  // 1. Leer settings de Firestore
  const settingsDoc = await firestore
    .doc(`instances/${firestoreId}/settings/general`)
    .get();
  const settings = settingsDoc.data() || {};

  // Crear instancia en PostgreSQL
  const instance = await prisma.instance.create({
    data: {
      name,
      brandName: settings.brandName || name,
      sheetId: settings.sheetId || null,
      sheetGid: settings.sheetGid || null,
      destinations: settings.destinations || [],
    },
  });
  console.log(`  Instancia creada: ${instance.id}`);

  // 2. Migrar usuarios
  const usersSnap = await firestore
    .collection(`instances/${firestoreId}/users`)
    .get();

  let userCount = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const uid = doc.id;

    try {
      await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: data.email || `${uid}@migrated.local`,
          name: data.name || "Sin nombre",
          role: mapRole(data.role),
          status: data.status === "ACTIVO" ? "ACTIVE" : "INACTIVE",
          instanceId: instance.id,
          canCreateLabel: data.canCreateLabel ?? false,
          canEditProduct: data.canEditProduct ?? false,
          canEditBitacora: data.canEditBitacora ?? false,
          canUseAI: data.canUseAI ?? true,
          licenseEndDate: data.license?.endDate?.toDate?.() || null,
        },
      });
      userCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  WARN: No se pudo migrar usuario ${uid}: ${msg}`);
    }
  }
  console.log(`  ${userCount} usuarios migrados`);

  // 3. Migrar productos (productCatalog)
  const productsSnap = await firestore
    .collection(`instances/${firestoreId}/productCatalog`)
    .get();

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  WARN: No se pudo migrar producto ${d.productCode}: ${msg}`);
    }
  }
  console.log(`  ${productCount} productos migrados`);

  // 4. Migrar etiquetas/bitacora (labels)
  const labelsSnap = await firestore
    .collection(`instances/${firestoreId}/labels`)
    .get();

  let labelCount = 0;
  let bitacoraCount = 0;
  for (const doc of labelsSnap.docs) {
    const d = doc.data();
    const data = d.data || {};

    try {
      // Crear etiqueta
      const productionDate = data.productionDate
        ? new Date(data.productionDate)
        : d.createdAt?.toDate?.() || null;

      await prisma.label.create({
        data: {
          productName: d.name || data.productName || "Sin nombre",
          brand: settings.brandName || name,
          netContent: data.netContent || null,
          origin: data.origin || null,
          productionDate: productionDate && !isNaN(productionDate.getTime()) ? productionDate : null,
          batch: data.batch || null,
          packedBy: data.packedBy || null,
          destination: data.destination || null,
          instanceId: instance.id,
        },
      });
      labelCount++;

      // Crear entrada de bitacora correspondiente
      const refDays = parseInt(data.refrigeratedDays) || 0;
      const frzDays = parseInt(data.frozenDays) || 0;
      const ambDays = parseInt(data.ambientDays) || 0;

      let coldChain = "--";
      if (frzDays > 0) coldChain = "Congelado";
      else if (refDays > 0) coldChain = "Refrigerado";
      else if (ambDays > 0) coldChain = "Ambiente";

      const procDate = productionDate && !isNaN(productionDate.getTime()) ? productionDate : null;
      let expiryRef: Date | null = null;
      let expiryFrz: Date | null = null;

      if (procDate) {
        if (frzDays > 0) {
          expiryFrz = new Date(procDate);
          expiryFrz.setDate(expiryFrz.getDate() + frzDays);
        }
        if (refDays > 0) {
          expiryRef = new Date(procDate);
          expiryRef.setDate(expiryRef.getDate() + refDays);
        } else if (ambDays > 0) {
          expiryRef = new Date(procDate);
          expiryRef.setDate(expiryRef.getDate() + ambDays);
        }
      }

      await prisma.bitacoraEntry.create({
        data: {
          productName: d.name || data.productName || "Sin nombre",
          category: data.productCategory || null,
          coldChain,
          processDate: procDate,
          expiryRefrigerated: expiryRef,
          expiryFrozen: expiryFrz,
          quantity: data.netContent || null,
          quantityProduced: data.productionCount?.toString() || null,
          packedBy: data.packedBy || null,
          destination: data.destination || null,
          batch: data.batch || null,
          traceDate: data.traceTimestamp ? new Date(data.traceTimestamp) : null,
          instanceId: instance.id,
        },
      });
      bitacoraCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  WARN: No se pudo migrar label ${doc.id}: ${msg}`);
    }
  }
  console.log(`  ${labelCount} etiquetas migradas`);
  console.log(`  ${bitacoraCount} entradas de bitacora creadas`);

  // 5. Migrar print settings
  const printDoc = await firestore
    .doc(`instances/${firestoreId}/settings/print`)
    .get();
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
  console.log("=== Migracion Firestore → PostgreSQL ===");
  console.log(`Fecha: ${new Date().toISOString()}\n`);

  for (const inst of INSTANCES) {
    try {
      await migrateInstance(inst.firestoreId, inst.name);
    } catch (err) {
      console.error(`ERROR migrando ${inst.name}:`, err);
    }
  }

  // Resumen
  const [instances, users, products, labels, bitacora] = await Promise.all([
    prisma.instance.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.label.count(),
    prisma.bitacoraEntry.count(),
  ]);

  console.log("\n=== Resumen ===");
  console.log(`  Instancias: ${instances}`);
  console.log(`  Usuarios:   ${users}`);
  console.log(`  Productos:  ${products}`);
  console.log(`  Etiquetas:  ${labels}`);
  console.log(`  Bitacora:   ${bitacora}`);
  console.log("\nMigracion completa!");
}

main()
  .catch((e) => {
    console.error("Error fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
