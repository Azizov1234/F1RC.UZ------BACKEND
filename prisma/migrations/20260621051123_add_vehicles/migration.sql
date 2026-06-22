/*
  Warnings:

  - You are about to drop the column `status` on the `RacingCategory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RacingCategory" DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "Vehicle_isActive_idx" ON "Vehicle"("isActive");
