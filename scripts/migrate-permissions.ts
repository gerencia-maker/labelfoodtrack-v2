/**
 * Data migration script: backfill permisos[] array for users that have none set.
 *
 * Run with: npx tsx scripts/migrate-permissions.ts
 *
 * Mapping:
 *   ADMIN → all permissions
 *   EDITOR → base modules + common sub-actions
 *   VIEWER → read-only modules (dashboard, products, labels, bitacora)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      permisos: true,
    },
  });

  console.log(`Found ${users.length} users to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    // Skip users that already have permisos set
    if (user.permisos.length > 0) {
      console.log(`  [SKIP] ${user.id} (role=${user.role}) — already has ${user.permisos.length} permissions`);
      skipped++;
      continue;
    }

    const permisos = new Set<string>();

    if (user.role === "ADMIN") {
      permisos.add("dashboard");
      permisos.add("products");
      permisos.add("labels");
      permisos.add("bitacora");
      permisos.add("configuration");
      permisos.add("ai_features");
      permisos.add("export");
      permisos.add("import");
    } else if (user.role === "EDITOR") {
      permisos.add("dashboard");
      permisos.add("products");
      permisos.add("labels");
      permisos.add("bitacora");
      permisos.add("labels.crear");
      permisos.add("products.editar");
      permisos.add("bitacora.crear");
      permisos.add("bitacora.editar");
      permisos.add("ai_features");
    } else {
      // VIEWER gets read-only modules
      permisos.add("dashboard");
      permisos.add("products");
      permisos.add("labels");
      permisos.add("bitacora");
    }

    const permisosArray = Array.from(permisos);

    await prisma.user.update({
      where: { id: user.id },
      data: { permisos: permisosArray },
    });

    console.log(`  [OK] ${user.id} (role=${user.role}) → ${permisosArray.length} permissions: [${permisosArray.join(", ")}]`);
    migrated++;
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
