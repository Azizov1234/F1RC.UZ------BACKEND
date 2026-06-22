-- CreateTable
CREATE TABLE "RacingCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "speedRange" TEXT,
    "trackType" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RacingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RacingCategory_slug_key" ON "RacingCategory"("slug");

-- CreateIndex
CREATE INDEX "RacingCategory_isActive_idx" ON "RacingCategory"("isActive");

-- CreateIndex
CREATE INDEX "RacingCategory_sortOrder_idx" ON "RacingCategory"("sortOrder");
