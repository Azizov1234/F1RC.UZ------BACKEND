/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `UserSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserSession_id_userId_key" ON "UserSession"("id", "userId");
