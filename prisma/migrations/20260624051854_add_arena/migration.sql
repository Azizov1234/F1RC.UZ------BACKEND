-- CreateEnum
CREATE TYPE "ArenaZoneType" AS ENUM ('START_GRID', 'PIT_LANE', 'RALLY_ZONE', 'FINISH_LINE', 'SPECTATOR_ZONE', 'SERVICE_ZONE', 'CONTROL_ROOM', 'OTHER');

-- CreateTable
CREATE TABLE "Arena" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackLayout" (
    "id" SERIAL NOT NULL,
    "arenaId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "lengthMeters" INTEGER,
    "difficulty" "ExperienceLevel",
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaZone" (
    "id" SERIAL NOT NULL,
    "arenaId" INTEGER NOT NULL,
    "trackLayoutId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "zoneType" "ArenaZoneType" NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArenaZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Arena_slug_key" ON "Arena"("slug");

-- CreateIndex
CREATE INDEX "Arena_isActive_idx" ON "Arena"("isActive");

-- CreateIndex
CREATE INDEX "Arena_sortOrder_idx" ON "Arena"("sortOrder");

-- CreateIndex
CREATE INDEX "Arena_city_idx" ON "Arena"("city");

-- CreateIndex
CREATE INDEX "TrackLayout_arenaId_idx" ON "TrackLayout"("arenaId");

-- CreateIndex
CREATE INDEX "TrackLayout_categoryId_idx" ON "TrackLayout"("categoryId");

-- CreateIndex
CREATE INDEX "TrackLayout_difficulty_idx" ON "TrackLayout"("difficulty");

-- CreateIndex
CREATE INDEX "TrackLayout_isActive_idx" ON "TrackLayout"("isActive");

-- CreateIndex
CREATE INDEX "TrackLayout_sortOrder_idx" ON "TrackLayout"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrackLayout_arenaId_slug_key" ON "TrackLayout"("arenaId", "slug");

-- CreateIndex
CREATE INDEX "ArenaZone_arenaId_idx" ON "ArenaZone"("arenaId");

-- CreateIndex
CREATE INDEX "ArenaZone_trackLayoutId_idx" ON "ArenaZone"("trackLayoutId");

-- CreateIndex
CREATE INDEX "ArenaZone_zoneType_idx" ON "ArenaZone"("zoneType");

-- CreateIndex
CREATE INDEX "ArenaZone_isActive_idx" ON "ArenaZone"("isActive");

-- CreateIndex
CREATE INDEX "ArenaZone_sortOrder_idx" ON "ArenaZone"("sortOrder");

-- AddForeignKey
ALTER TABLE "TrackLayout" ADD CONSTRAINT "TrackLayout_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLayout" ADD CONSTRAINT "TrackLayout_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RacingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaZone" ADD CONSTRAINT "ArenaZone_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaZone" ADD CONSTRAINT "ArenaZone_trackLayoutId_fkey" FOREIGN KEY ("trackLayoutId") REFERENCES "TrackLayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
