-- AlterEnum
ALTER TYPE "VehicleStatus" ADD VALUE 'DISABLED';

-- AlterTable
ALTER TABLE "RacingCategory" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';
