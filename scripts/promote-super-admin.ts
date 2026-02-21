/**
 * Promote a user to super-admin by setting instanceId = null.
 *
 * Usage:
 *   npx tsx scripts/promote-super-admin.ts gerencia@gesstionpg.com
 *   npx tsx scripts/promote-super-admin.ts <email>
 *
 * This gives the user access to ALL instances (super-admin).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_PERMISOS = [
  "dashboard",
  "products",
  "labels",
  "bitacora",
  "configuration",
  "ai_features",
  "export",
  "import",
  "instances",
];

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/promote-super-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`User not found: ${email}`);
    console.log("\nAvailable users:");
    const users = await prisma.user.findMany({ select: { email: true, role: true, instanceId: true } });
    for (const u of users) {
      console.log(`  ${u.email} (role=${u.role}, instanceId=${u.instanceId})`);
    }
    process.exit(1);
  }

  if (!user.instanceId) {
    console.log(`${email} is already a super-admin (instanceId = null)`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      instanceId: null,
      role: "ADMIN",
      permisos: ALL_PERMISOS,
    },
  });

  console.log(`Super-admin promoted successfully:`);
  console.log(`  Email: ${updated.email}`);
  console.log(`  Name: ${updated.name}`);
  console.log(`  Role: ${updated.role}`);
  console.log(`  instanceId: ${updated.instanceId} (null = super-admin)`);
  console.log(`  Permisos: [${updated.permisos.join(", ")}]`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
