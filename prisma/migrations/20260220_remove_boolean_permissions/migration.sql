-- Remove legacy boolean permission columns from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "canCreateLabel";
ALTER TABLE "User" DROP COLUMN IF EXISTS "canEditProduct";
ALTER TABLE "User" DROP COLUMN IF EXISTS "canEditBitacora";
ALTER TABLE "User" DROP COLUMN IF EXISTS "canUseAI";
