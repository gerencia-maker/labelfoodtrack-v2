-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('BASIC', 'ENTERPRISE');

-- AlterTable: Instance
ALTER TABLE "Instance" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'BASIC';
ALTER TABLE "Instance" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: User - add new permission fields
ALTER TABLE "User" ADD COLUMN "permisos" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: User - make instanceId nullable for super-admin support
ALTER TABLE "User" ALTER COLUMN "instanceId" DROP NOT NULL;
