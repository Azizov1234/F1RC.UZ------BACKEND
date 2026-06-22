-- DropIndex
DROP INDEX "Profile_experienceLevel_userId_idx";

-- CreateIndex
CREATE INDEX "Profile_experienceLevel_idx" ON "Profile"("experienceLevel");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");
